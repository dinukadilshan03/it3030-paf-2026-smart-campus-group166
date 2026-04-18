package com.smartcampus.backend.modules.adminanalytics.service;

import com.smartcampus.backend.common.entity.LocalAuthCredential;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.AuthEventType;
import com.smartcampus.backend.common.enums.BookingStatus;
import com.smartcampus.backend.common.enums.NotificationType;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.TicketStatus;
import com.smartcampus.backend.common.enums.UserLoginMethod;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsAskResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsChartsResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsHealthResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsInsightsResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsOverviewResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AnalyticsAlertResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AnalyticsMetricCardResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AnalyticsNamedValueResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AnalyticsQuickLinkResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AnalyticsRange;
import com.smartcampus.backend.modules.adminanalytics.dto.AnalyticsRecentUserActivityResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AnalyticsSeriesPointResponse;
import com.smartcampus.backend.modules.auth.entity.AuthEvent;
import com.smartcampus.backend.modules.auth.repository.AuthEventRepository;
import com.smartcampus.backend.modules.auth.repository.LocalAuthCredentialRepository;
import com.smartcampus.backend.modules.booking.entity.Booking;
import com.smartcampus.backend.modules.booking.repository.BookingRepository;
import com.smartcampus.backend.modules.notification.entity.Notification;
import com.smartcampus.backend.modules.notification.repository.NotificationRepository;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.repository.TicketRepository;
import com.smartcampus.backend.modules.user.repository.UserRepository;
import com.smartcampus.backend.modules.user.repository.UserRoleRepository;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminAnalyticsService {

    private static final DateTimeFormatter DAY_LABEL = DateTimeFormatter.ofPattern("MMM d", Locale.ENGLISH);

    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final LocalAuthCredentialRepository localAuthCredentialRepository;
    private final NotificationRepository notificationRepository;
    private final AuthEventRepository authEventRepository;
    private final AnalyticsAiService analyticsAiService;

    @Value("${app.analytics.timezone:Asia/Colombo}")
    private String analyticsTimezone;

    @Transactional(readOnly = true)
    public AdminAnalyticsOverviewResponse getOverview(AnalyticsRange range) {
        AnalyticsSnapshot snapshot = buildSnapshot(range);
        return snapshot.overview();
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsChartsResponse getCharts(AnalyticsRange range) {
        AnalyticsSnapshot snapshot = buildSnapshot(range);
        return snapshot.charts();
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsHealthResponse getHealth(AnalyticsRange range) {
        AnalyticsSnapshot snapshot = buildSnapshot(range);
        return snapshot.health();
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsInsightsResponse getInsights(AnalyticsRange range) {
        AnalyticsSnapshot snapshot = buildSnapshot(range);
        return analyticsAiService.generateInsights(buildAiSnapshot(snapshot));
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsAskResponse ask(AnalyticsRange range, String question) {
        AnalyticsSnapshot snapshot = buildSnapshot(range);
        return analyticsAiService.answerQuestion(question, buildAiSnapshot(snapshot));
    }

    private AnalyticsSnapshot buildSnapshot(AnalyticsRange range) {
        ZoneId zoneId = ZoneId.of(analyticsTimezone);
        LocalDate today = LocalDate.now(zoneId);
        LocalDate currentStartDate = today.minusDays(range.days() - 1L);
        LocalDate currentEndDate = today;
        LocalDate previousStartDate = currentStartDate.minusDays(range.days());
        LocalDate previousEndDate = currentStartDate.minusDays(1);

        LocalDateTime currentStart = toUtcStart(currentStartDate, zoneId);
        LocalDateTime currentEnd = toUtcStart(currentEndDate.plusDays(1), zoneId);
        LocalDateTime previousStart = toUtcStart(previousStartDate, zoneId);
        LocalDateTime previousEnd = toUtcStart(previousEndDate.plusDays(1), zoneId);

        List<Booking> scheduledBookings = bookingRepository.findScheduledBetween(currentStartDate, currentEndDate);
        List<Booking> previousScheduledBookings =
                bookingRepository.findScheduledBetween(previousStartDate, previousEndDate);
        List<Ticket> currentTickets = ticketRepository.findCreatedBetween(currentStart, currentEnd);
        List<Ticket> previousTickets = ticketRepository.findCreatedBetween(previousStart, previousEnd);
        List<Notification> currentNotifications =
                notificationRepository.findCreatedBetween(currentStart, currentEnd);
        List<Notification> previousNotifications =
                notificationRepository.findCreatedBetween(previousStart, previousEnd);
        List<AuthEvent> currentAuthEvents = authEventRepository.findByCreatedAtBetween(currentStart, currentEnd);
        List<AuthEvent> previousAuthEvents = authEventRepository.findByCreatedAtBetween(previousStart, previousEnd);

        List<User> users = userRepository.findAll();
        Map<Long, UserRole> activeRoles =
                userRoleRepository.findActiveByUserIds(users.stream().map(User::getId).toList()).stream()
                        .collect(Collectors.toMap(ur -> ur.getUser().getId(), Function.identity()));
        Map<Long, LocalAuthCredential> credentialsByUserId =
                localAuthCredentialRepository.findByUserIdIn(users.stream().map(User::getId).toList()).stream()
                        .collect(Collectors.toMap(credential -> credential.getUser().getId(), Function.identity()));

        LocalDateTime generatedAt = LocalDateTime.now();

        List<AnalyticsQuickLinkResponse> quickLinks = buildQuickLinks();
        List<AnalyticsAlertResponse> alerts =
                buildFlags(users, activeRoles, credentialsByUserId, currentNotifications, currentAuthEvents, currentTickets);

        AdminAnalyticsOverviewResponse overview =
                new AdminAnalyticsOverviewResponse(
                        range,
                        generatedAt,
                        buildMetricCards(
                                scheduledBookings,
                                previousScheduledBookings,
                                currentTickets,
                                previousTickets,
                                currentAuthEvents,
                                previousAuthEvents,
                                currentNotifications,
                                previousNotifications),
                        alerts.stream().limit(4).toList(),
                        quickLinks);

        AdminAnalyticsChartsResponse charts =
                new AdminAnalyticsChartsResponse(
                        range,
                        generatedAt,
                        buildBookingsByDay(currentStartDate, currentEndDate, scheduledBookings),
                        buildPeakBookingHours(scheduledBookings),
                        buildTopResources(scheduledBookings),
                        buildTopLocations(scheduledBookings),
                        buildTicketsByDay(currentStartDate, currentEndDate, currentTickets, zoneId),
                        buildTicketCategories(currentTickets),
                        buildNotificationTypes(currentNotifications),
                        buildAuthEventTypes(currentAuthEvents));

        AdminAnalyticsHealthResponse health =
                new AdminAnalyticsHealthResponse(
                        range,
                        generatedAt,
                        buildRoleDistribution(users, activeRoles),
                        buildStatusDistribution(users),
                        buildLoginMethodDistribution(users, activeRoles, credentialsByUserId),
                        buildAuthHealth(users, activeRoles, credentialsByUserId, currentAuthEvents),
                        buildNotificationHealth(currentNotifications, currentStart, currentEnd),
                        alerts,
                        buildRecentSignIns(users, activeRoles));

        return new AnalyticsSnapshot(range, overview, charts, health, quickLinks);
    }

    private List<AnalyticsMetricCardResponse> buildMetricCards(
            List<Booking> currentBookings,
            List<Booking> previousBookings,
            List<Ticket> currentTickets,
            List<Ticket> previousTickets,
            List<AuthEvent> currentAuthEvents,
            List<AuthEvent> previousAuthEvents,
            List<Notification> currentNotifications,
            List<Notification> previousNotifications) {
        double currentApprovalRate = computeApprovalRate(currentBookings);
        double previousApprovalRate = computeApprovalRate(previousBookings);
        long currentLoginFailures = countAuthEvents(currentAuthEvents, AuthEventType.LOGIN_FAILURE);
        long previousLoginFailures = countAuthEvents(previousAuthEvents, AuthEventType.LOGIN_FAILURE);
        double currentResolutionHours = computeAverageResolutionHours(currentTickets);
        double previousResolutionHours = computeAverageResolutionHours(previousTickets);

        return List.of(
                metricCard(
                        "booking_total",
                        "Bookings in window",
                        Long.toString(currentBookings.size()),
                        formatComparison(currentBookings.size(), previousBookings.size(), false),
                        trendForCount(currentBookings.size(), previousBookings.size()),
                        "/bookings"),
                metricCard(
                        "booking_approval_rate",
                        "Approval rate",
                        formatPercent(currentApprovalRate),
                        formatComparison(currentApprovalRate, previousApprovalRate, true),
                        trendForRate(currentApprovalRate, previousApprovalRate),
                        "/bookings"),
                metricCard(
                        "ticket_created_total",
                        "Tickets created",
                        Long.toString(currentTickets.size()),
                        formatComparison(currentTickets.size(), previousTickets.size(), false),
                        trendForCount(currentTickets.size(), previousTickets.size()),
                        "/tickets"),
                metricCard(
                        "ticket_avg_resolution_hours",
                        "Avg resolution",
                        currentResolutionHours <= 0 ? "No resolved tickets" : formatHours(currentResolutionHours),
                        formatComparison(currentResolutionHours, previousResolutionHours, true),
                        trendForResolution(currentResolutionHours, previousResolutionHours),
                        "/tickets"),
                metricCard(
                        "auth_login_failures",
                        "Login failures",
                        Long.toString(currentLoginFailures),
                        formatComparison(currentLoginFailures, previousLoginFailures, false),
                        trendForFailures(currentLoginFailures, previousLoginFailures),
                        "/analytics"),
                metricCard(
                        "notification_generated_total",
                        "Notifications generated",
                        Long.toString(currentNotifications.size()),
                        formatComparison(currentNotifications.size(), previousNotifications.size(), false),
                        trendForCount(currentNotifications.size(), previousNotifications.size()),
                        "/notifications"));
    }

    private AnalyticsMetricCardResponse metricCard(
            String id, String label, String value, String changeLabel, String trend, String href) {
        return new AnalyticsMetricCardResponse(id, label, value, changeLabel, trend, href);
    }

    private List<AnalyticsAlertResponse> buildFlags(
            List<User> users,
            Map<Long, UserRole> activeRoles,
            Map<Long, LocalAuthCredential> credentialsByUserId,
            List<Notification> currentNotifications,
            List<AuthEvent> currentAuthEvents,
            List<Ticket> currentTickets) {
        List<AnalyticsAlertResponse> alerts = new ArrayList<>();

        long lockedAccounts =
                credentialsByUserId.values().stream().filter(credential -> credential.getLockedUntil() != null).count();
        if (lockedAccounts > 0) {
            alerts.add(
                    new AnalyticsAlertResponse(
                            "flag_locked_accounts",
                            "Locked local accounts",
                            "%d local account(s) are currently locked and may need an admin review.".formatted(lockedAccounts),
                            "high",
                            "/users",
                            List.of("auth_locked_accounts")));
        }

        LocalDateTime dormantThreshold = LocalDateTime.now().minusDays(30);
        long dormantAdmins =
                users.stream()
                        .filter(user -> activeRoles.get(user.getId()) != null)
                        .filter(user -> activeRoles.get(user.getId()).getRole().getCode() == RoleCode.ADMIN)
                        .filter(user -> user.getLastLoginAt() == null || user.getLastLoginAt().isBefore(dormantThreshold))
                        .count();
        if (dormantAdmins > 0) {
            alerts.add(
                    new AnalyticsAlertResponse(
                            "flag_dormant_admins",
                            "Dormant admin coverage",
                            "%d admin account(s) have not signed in during the last 30 days.".formatted(dormantAdmins),
                            "medium",
                            "/users",
                            List.of("auth_dormant_admins")));
        }

        long passwordChangePending =
                credentialsByUserId.values().stream().filter(LocalAuthCredential::isMustChangePassword).count();
        if (passwordChangePending > 0) {
            alerts.add(
                    new AnalyticsAlertResponse(
                            "flag_password_change_pending",
                            "Temporary passwords still pending",
                            "%d local account(s) still require a password change.".formatted(passwordChangePending),
                            "medium",
                            "/users",
                            List.of("auth_password_change_pending")));
        }

        long unreadBacklog = notificationRepository.countAllUnread();
        if (unreadBacklog > 12) {
            alerts.add(
                    new AnalyticsAlertResponse(
                            "flag_notification_backlog",
                            "Notification backlog rising",
                            "%d unread notifications are still waiting for attention across the platform.".formatted(unreadBacklog),
                            "medium",
                            "/notifications",
                            List.of("notification_unread_backlog")));
        }

        long unresolvedTickets =
                currentTickets.stream()
                        .filter(ticket -> ticket.getStatus() == TicketStatus.OPEN || ticket.getStatus() == TicketStatus.IN_PROGRESS)
                        .count();
        if (unresolvedTickets > 0) {
            alerts.add(
                    new AnalyticsAlertResponse(
                            "flag_unresolved_tickets",
                            "Open ticket load in range",
                            "%d ticket(s) created in this window are still open or in progress.".formatted(unresolvedTickets),
                            "low",
                            "/tickets",
                            List.of("ticket_created_total")));
        }

        alerts.sort(Comparator.comparing(this::severityRank).thenComparing(AnalyticsAlertResponse::title));
        return alerts;
    }

    private List<AnalyticsSeriesPointResponse> buildBookingsByDay(
            LocalDate startDate, LocalDate endDate, List<Booking> bookings) {
        Map<LocalDate, Long> counts =
                bookings.stream()
                        .collect(Collectors.groupingBy(Booking::getBookingDate, Collectors.counting()));
        List<AnalyticsSeriesPointResponse> points = new ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            points.add(
                    new AnalyticsSeriesPointResponse(
                            "booking_day_" + date,
                            date.format(DAY_LABEL),
                            counts.getOrDefault(date, 0L),
                            "/bookings"));
        }
        return points;
    }

    private List<AnalyticsSeriesPointResponse> buildPeakBookingHours(List<Booking> bookings) {
        Map<Integer, Long> counts =
                bookings.stream()
                        .collect(Collectors.groupingBy(booking -> booking.getStartTime().getHour(), Collectors.counting()));
        List<AnalyticsSeriesPointResponse> points = new ArrayList<>();
        for (int hour = 7; hour <= 20; hour++) {
            points.add(
                    new AnalyticsSeriesPointResponse(
                            "booking_hour_" + hour,
                            "%02d:00".formatted(hour),
                            counts.getOrDefault(hour, 0L),
                            "/bookings"));
        }
        return points;
    }

    private List<AnalyticsSeriesPointResponse> buildTopResources(List<Booking> bookings) {
        return topCountSeries(
                bookings,
                booking -> booking.getResource().getName(),
                "resource",
                "/resources");
    }

    private List<AnalyticsSeriesPointResponse> buildTopLocations(List<Booking> bookings) {
        return topCountSeries(
                bookings,
                booking -> booking.getResource().getLocation().getName(),
                "location",
                "/resources");
    }

    private <T> List<AnalyticsSeriesPointResponse> topCountSeries(
            List<T> items, Function<T, String> classifier, String prefix, String href) {
        return items.stream()
                .collect(Collectors.groupingBy(classifier, Collectors.counting()))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry::getKey))
                .limit(6)
                .map(
                        entry ->
                                new AnalyticsSeriesPointResponse(
                                        prefix + "_" + sanitizeId(entry.getKey()),
                                        entry.getKey(),
                                        entry.getValue(),
                                        href))
                .toList();
    }

    private List<AnalyticsSeriesPointResponse> buildTicketsByDay(
            LocalDate startDate, LocalDate endDate, List<Ticket> tickets, ZoneId zoneId) {
        Map<LocalDate, Long> counts =
                tickets.stream()
                        .collect(
                                Collectors.groupingBy(
                                        ticket -> toZone(ticket.getCreatedAt(), zoneId).toLocalDate(),
                                        Collectors.counting()));
        List<AnalyticsSeriesPointResponse> points = new ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            points.add(
                    new AnalyticsSeriesPointResponse(
                            "ticket_day_" + date,
                            date.format(DAY_LABEL),
                            counts.getOrDefault(date, 0L),
                            "/tickets"));
        }
        return points;
    }

    private List<AnalyticsSeriesPointResponse> buildTicketCategories(List<Ticket> tickets) {
        return tickets.stream()
                .collect(Collectors.groupingBy(ticket -> ticket.getTicketCategory().getName(), Collectors.counting()))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry::getKey))
                .limit(6)
                .map(
                        entry ->
                                new AnalyticsSeriesPointResponse(
                                        "ticket_category_" + sanitizeId(entry.getKey()),
                                        entry.getKey(),
                                        entry.getValue(),
                                        "/tickets"))
                .toList();
    }

    private List<AnalyticsSeriesPointResponse> buildNotificationTypes(List<Notification> notifications) {
        return notifications.stream()
                .collect(Collectors.groupingBy(Notification::getType, Collectors.counting()))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<NotificationType, Long>comparingByValue().reversed())
                .map(
                        entry ->
                                new AnalyticsSeriesPointResponse(
                                        "notification_type_" + entry.getKey().name().toLowerCase(Locale.ENGLISH),
                                        entry.getKey().name(),
                                        entry.getValue(),
                                        "/notifications"))
                .toList();
    }

    private List<AnalyticsSeriesPointResponse> buildAuthEventTypes(List<AuthEvent> authEvents) {
        return authEvents.stream()
                .collect(Collectors.groupingBy(AuthEvent::getEventType, Collectors.counting()))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<AuthEventType, Long>comparingByValue().reversed())
                .map(
                        entry ->
                                new AnalyticsSeriesPointResponse(
                                        "auth_event_" + entry.getKey().name().toLowerCase(Locale.ENGLISH),
                                        entry.getKey().name().replace('_', ' '),
                                        entry.getValue(),
                                        "/analytics"))
                .toList();
    }

    private List<AnalyticsNamedValueResponse> buildRoleDistribution(
            List<User> users, Map<Long, UserRole> activeRoles) {
        Map<RoleCode, Long> counts = new EnumMap<>(RoleCode.class);
        for (User user : users) {
            UserRole role = activeRoles.get(user.getId());
            if (role == null) {
                continue;
            }
            counts.merge(role.getRole().getCode(), 1L, Long::sum);
        }
        return counts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(
                        entry ->
                                new AnalyticsNamedValueResponse(
                                        "role_" + entry.getKey().name().toLowerCase(Locale.ENGLISH),
                                        entry.getKey().name(),
                                        Long.toString(entry.getValue()),
                                        "/users"))
                .toList();
    }

    private List<AnalyticsNamedValueResponse> buildStatusDistribution(List<User> users) {
        Map<UserStatus, Long> counts = new EnumMap<>(UserStatus.class);
        for (User user : users) {
            counts.merge(user.getStatus(), 1L, Long::sum);
        }
        return counts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(
                        entry ->
                                new AnalyticsNamedValueResponse(
                                        "status_" + entry.getKey().name().toLowerCase(Locale.ENGLISH),
                                        entry.getKey().name(),
                                        Long.toString(entry.getValue()),
                                        "/users"))
                .toList();
    }

    private List<AnalyticsNamedValueResponse> buildLoginMethodDistribution(
            List<User> users,
            Map<Long, UserRole> activeRoles,
            Map<Long, LocalAuthCredential> credentialsByUserId) {
        Map<UserLoginMethod, Long> counts = new EnumMap<>(UserLoginMethod.class);
        for (User user : users) {
            UserRole role = activeRoles.get(user.getId());
            if (role == null) {
                continue;
            }
            UserLoginMethod loginMethod =
                    role.getRole().getCode() == RoleCode.STUDENT ? UserLoginMethod.GOOGLE : UserLoginMethod.LOCAL;
            if (loginMethod == UserLoginMethod.LOCAL && !credentialsByUserId.containsKey(user.getId())) {
                continue;
            }
            counts.merge(loginMethod, 1L, Long::sum);
        }
        return counts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(
                        entry ->
                                new AnalyticsNamedValueResponse(
                                        "login_method_" + entry.getKey().name().toLowerCase(Locale.ENGLISH),
                                        entry.getKey().name(),
                                        Long.toString(entry.getValue()),
                                        "/users"))
                .toList();
    }

    private List<AnalyticsNamedValueResponse> buildAuthHealth(
            List<User> users,
            Map<Long, UserRole> activeRoles,
            Map<Long, LocalAuthCredential> credentialsByUserId,
            List<AuthEvent> currentAuthEvents) {
        long lockedAccounts =
                credentialsByUserId.values().stream().filter(credential -> credential.getLockedUntil() != null).count();
        long passwordChangePending =
                credentialsByUserId.values().stream().filter(LocalAuthCredential::isMustChangePassword).count();
        LocalDateTime dormantThreshold = LocalDateTime.now().minusDays(30);
        long dormantAdmins =
                users.stream()
                        .filter(user -> activeRoles.get(user.getId()) != null)
                        .filter(user -> activeRoles.get(user.getId()).getRole().getCode() == RoleCode.ADMIN)
                        .filter(user -> user.getLastLoginAt() == null || user.getLastLoginAt().isBefore(dormantThreshold))
                        .count();
        long successfulLogins = countAuthEvents(currentAuthEvents, AuthEventType.LOGIN_SUCCESS);
        long failedLogins = countAuthEvents(currentAuthEvents, AuthEventType.LOGIN_FAILURE);

        return List.of(
                new AnalyticsNamedValueResponse("auth_success_logins", "Successful logins", Long.toString(successfulLogins), "/analytics"),
                new AnalyticsNamedValueResponse("auth_failed_logins", "Failed logins", Long.toString(failedLogins), "/analytics"),
                new AnalyticsNamedValueResponse("auth_locked_accounts", "Locked local accounts", Long.toString(lockedAccounts), "/users"),
                new AnalyticsNamedValueResponse("auth_password_change_pending", "Password change pending", Long.toString(passwordChangePending), "/users"),
                new AnalyticsNamedValueResponse("auth_dormant_admins", "Dormant admins", Long.toString(dormantAdmins), "/users"));
    }

    private List<AnalyticsNamedValueResponse> buildNotificationHealth(
            List<Notification> currentNotifications, LocalDateTime currentStart, LocalDateTime currentEnd) {
        long unreadBacklog = notificationRepository.countAllUnread();
        long readInWindow =
                notificationRepository.countByReadAtGreaterThanEqualAndReadAtLessThan(currentStart, currentEnd);
        return List.of(
                new AnalyticsNamedValueResponse("notification_unread_backlog", "Unread backlog", Long.toString(unreadBacklog), "/notifications"),
                new AnalyticsNamedValueResponse("notification_read_activity", "Read in window", Long.toString(readInWindow), "/notifications"),
                new AnalyticsNamedValueResponse("notification_created_window", "Generated in window", Long.toString(currentNotifications.size()), "/notifications"));
    }

    private List<AnalyticsRecentUserActivityResponse> buildRecentSignIns(
            List<User> users, Map<Long, UserRole> activeRoles) {
        return users.stream()
                .filter(user -> user.getLastLoginAt() != null)
                .sorted(Comparator.comparing(User::getLastLoginAt).reversed())
                .limit(6)
                .map(
                        user ->
                                new AnalyticsRecentUserActivityResponse(
                                        user.getId(),
                                        user.getDisplayName() == null || user.getDisplayName().isBlank()
                                                ? user.getEmail()
                                                : user.getDisplayName(),
                                        user.getEmail(),
                                        activeRoles.get(user.getId()) == null ? null : activeRoles.get(user.getId()).getRole().getCode(),
                                        user.getLastLoginAt(),
                                        "/users"))
                .toList();
    }

    private double computeApprovalRate(List<Booking> bookings) {
        long approved = bookings.stream().filter(booking -> booking.getStatus() == BookingStatus.APPROVED).count();
        long reviewed =
                bookings.stream()
                        .filter(
                                booking ->
                                        booking.getStatus() == BookingStatus.APPROVED
                                                || booking.getStatus() == BookingStatus.REJECTED)
                        .count();
        if (reviewed == 0) {
            return 0.0;
        }
        return (approved * 100.0) / reviewed;
    }

    private double computeAverageResolutionHours(List<Ticket> tickets) {
        List<Double> durations =
                tickets.stream()
                        .filter(ticket -> ticket.getResolvedAt() != null)
                        .map(
                                ticket ->
                                        Duration.between(ticket.getCreatedAt(), ticket.getResolvedAt()).toMinutes()
                                                / 60.0)
                        .filter(value -> value >= 0)
                        .toList();
        if (durations.isEmpty()) {
            return 0.0;
        }
        return durations.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
    }

    private long countAuthEvents(List<AuthEvent> events, AuthEventType type) {
        return events.stream().filter(event -> event.getEventType() == type).count();
    }

    private String formatComparison(double current, double previous, boolean percentageSuffix) {
        if (previous == 0.0 && current == 0.0) {
            return "No change from previous window";
        }

        if (previous == 0.0) {
            return "New vs previous empty window";
        }

        double change = ((current - previous) / previous) * 100.0;
        return "%s%s vs previous window"
                .formatted(change >= 0 ? "+" : "", Math.round(change * 10.0) / 10.0);
    }

    private String trendForCount(double current, double previous) {
        if (current > previous) {
            return "up";
        }
        if (current < previous) {
            return "down";
        }
        return "flat";
    }

    private String trendForRate(double current, double previous) {
        return trendForCount(current, previous);
    }

    private String trendForResolution(double current, double previous) {
        if (previous == 0.0) {
            return current > 0 ? "up" : "flat";
        }
        if (current < previous) {
            return "up";
        }
        if (current > previous) {
            return "down";
        }
        return "flat";
    }

    private String trendForFailures(double current, double previous) {
        if (current < previous) {
            return "up";
        }
        if (current > previous) {
            return "down";
        }
        return "flat";
    }

    private String formatPercent(double value) {
        return "%.1f%%".formatted(value);
    }

    private String formatHours(double value) {
        return "%.1f h".formatted(value);
    }

    private int severityRank(AnalyticsAlertResponse alert) {
        return switch (alert.severity()) {
            case "high" -> 0;
            case "medium" -> 1;
            default -> 2;
        };
    }

    private String sanitizeId(String value) {
        return value.toLowerCase(Locale.ENGLISH).replaceAll("[^a-z0-9]+", "_");
    }

    private LocalDateTime toZone(LocalDateTime value, ZoneId zoneId) {
        return value.atZone(ZoneOffset.UTC).withZoneSameInstant(zoneId).toLocalDateTime();
    }

    private LocalDateTime toUtcStart(LocalDate date, ZoneId zoneId) {
        return date.atStartOfDay(zoneId).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
    }

    private List<AnalyticsQuickLinkResponse> buildQuickLinks() {
        return List.of(
                new AnalyticsQuickLinkResponse("analytics", "Open analytics", "/analytics", "Inspect deeper operational trends, charts, and AI answers."),
                new AnalyticsQuickLinkResponse("users", "User management", "/users", "Audit roles, status changes, and credential posture."),
                new AnalyticsQuickLinkResponse("notifications", "Notifications", "/notifications", "Review unread backlog and delivery volume."),
                new AnalyticsQuickLinkResponse("bookings", "Bookings", "/bookings", "Review booking demand, approvals, and scheduling pressure."),
                new AnalyticsQuickLinkResponse("tickets", "Tickets", "/tickets", "Inspect issue workload and resolution velocity."));
    }

    private Map<String, Object> buildAiSnapshot(AnalyticsSnapshot snapshot) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("range", snapshot.range().wireValue());
        result.put("overview", snapshot.overview());
        result.put("charts", snapshot.charts());
        result.put("health", snapshot.health());
        result.put("quickLinks", snapshot.quickLinks().stream()
                .map(
                        link ->
                                Map.of(
                                        "id", link.id(),
                                        "label", link.label(),
                                        "href", link.href(),
                                        "description", link.description()))
                .toList());
        return result;
    }

    private record AnalyticsSnapshot(
            AnalyticsRange range,
            AdminAnalyticsOverviewResponse overview,
            AdminAnalyticsChartsResponse charts,
            AdminAnalyticsHealthResponse health,
            List<AnalyticsQuickLinkResponse> quickLinks) {}
}
