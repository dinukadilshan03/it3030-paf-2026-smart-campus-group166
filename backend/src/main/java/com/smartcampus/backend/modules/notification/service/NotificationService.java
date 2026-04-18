package com.smartcampus.backend.modules.notification.service;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.CommentType;
import com.smartcampus.backend.common.enums.NotificationReferenceType;
import com.smartcampus.backend.common.enums.NotificationType;
import com.smartcampus.backend.common.enums.TicketStatus;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.modules.auth.service.CurrentUserService;
import com.smartcampus.backend.modules.booking.entity.Booking;
import com.smartcampus.backend.modules.notification.dto.NotificationSummaryResponse;
import com.smartcampus.backend.modules.notification.dto.NotificationUnreadCountResponse;
import com.smartcampus.backend.modules.notification.entity.Notification;
import com.smartcampus.backend.modules.notification.mapper.NotificationMapper;
import com.smartcampus.backend.modules.notification.repository.NotificationRepository;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketComment;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final int MAX_LIMIT = 50;
    private static final DateTimeFormatter BOOKING_DATE_FORMAT =
            DateTimeFormatter.ofPattern("MMM d, uuuu", Locale.ENGLISH);
    private static final DateTimeFormatter BOOKING_TIME_FORMAT =
            DateTimeFormatter.ofPattern("HH:mm", Locale.ENGLISH);

    private final NotificationRepository notificationRepository;
    private final CurrentUserService currentUserService;
    private final NotificationMapper notificationMapper;

    @Transactional(readOnly = true)
    public List<NotificationSummaryResponse> getNotifications(Integer limit, Boolean unreadOnly) {
        User currentUser = getRequiredCurrentUser();
        Pageable pageable =
                limit == null ? Pageable.unpaged() : PageRequest.of(0, normalizeLimit(limit));

        return notificationRepository
                .findVisibleToUser(currentUser.getId(), Boolean.TRUE.equals(unreadOnly), pageable)
                .stream()
                .map(notificationMapper::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public NotificationUnreadCountResponse getUnreadCount() {
        User currentUser = getRequiredCurrentUser();
        return new NotificationUnreadCountResponse(
                notificationRepository.countByUser_IdAndIsReadFalse(currentUser.getId()));
    }

    @Transactional
    public NotificationSummaryResponse markAsRead(Long id) {
        User currentUser = getRequiredCurrentUser();
        Notification notification =
                notificationRepository
                        .findByIdAndUser_Id(id, currentUser.getId())
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Notification not found for id: " + id));

        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }

        return notificationMapper.toSummary(notification);
    }

    @Transactional
    public void markAllAsRead() {
        User currentUser = getRequiredCurrentUser();
        List<Notification> unreadNotifications =
                notificationRepository.findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(currentUser.getId());

        if (unreadNotifications.isEmpty()) {
            return;
        }

        LocalDateTime readAt = LocalDateTime.now();
        unreadNotifications.forEach(
                notification -> {
                    notification.setIsRead(true);
                    notification.setReadAt(readAt);
                });
        notificationRepository.saveAll(unreadNotifications);
    }

    @Transactional
    public void notifyBookingReviewed(Booking booking) {
        String title =
                booking.getStatus() == com.smartcampus.backend.common.enums.BookingStatus.APPROVED
                        ? "Booking approved"
                        : "Booking rejected";
        String message =
                "%s on %s from %s to %s"
                        .formatted(
                                booking.getResource().getName(),
                                booking.getBookingDate().format(BOOKING_DATE_FORMAT),
                                booking.getStartTime().format(BOOKING_TIME_FORMAT),
                                booking.getEndTime().format(BOOKING_TIME_FORMAT));

        createNotifications(
                List.of(booking.getRequesterUser()),
                null,
                NotificationType.BOOKING,
                title,
                message,
                NotificationReferenceType.BOOKING,
                booking.getId());
    }

    @Transactional
    public void notifyTicketStatusChanged(
            Ticket ticket, TicketStatus status, User actor, User assignedStaffSnapshot) {
        String title = "Ticket status updated";
        String message =
                "%s is now %s"
                        .formatted(ticket.getTicketNumber(), toHumanReadableStatus(status.name()));

        createNotifications(
                List.of(ticket.getReporterUser(), assignedStaffSnapshot),
                actor,
                NotificationType.TICKET,
                title,
                message,
                NotificationReferenceType.TICKET,
                ticket.getId());
    }

    @Transactional
    public void notifyTicketCommentAdded(Ticket ticket, TicketComment comment) {
        List<User> recipients = new ArrayList<>();
        if (comment.getCommentType() == CommentType.PUBLIC_REPLY) {
            recipients.add(ticket.getReporterUser());
            recipients.add(ticket.getAssignedStaffUser());
        } else if (comment.getCommentType() == CommentType.INTERNAL_NOTE) {
            recipients.add(ticket.getAssignedStaffUser());
        } else {
            return;
        }

        String title =
                comment.getCommentType() == CommentType.INTERNAL_NOTE
                        ? "Internal note added"
                        : "New ticket comment";
        String message =
                "%s on %s"
                        .formatted(resolveDisplayName(comment.getAuthorUser()), ticket.getTicketNumber());

        createNotifications(
                recipients,
                comment.getAuthorUser(),
                NotificationType.COMMENT,
                title,
                message,
                NotificationReferenceType.TICKET,
                ticket.getId());
    }

    private void createNotifications(
            Collection<User> recipients,
            User actor,
            NotificationType type,
            String title,
            String message,
            NotificationReferenceType referenceType,
            Long referenceId) {
        Map<Long, User> uniqueRecipients = new LinkedHashMap<>();
        for (User recipient : recipients) {
            if (recipient == null || recipient.getId() == null) {
                continue;
            }
            if (actor != null && recipient.getId().equals(actor.getId())) {
                continue;
            }
            uniqueRecipients.putIfAbsent(recipient.getId(), recipient);
        }

        if (uniqueRecipients.isEmpty()) {
            return;
        }

        List<Notification> notifications =
                uniqueRecipients.values().stream()
                        .map(
                                recipient ->
                                        Notification.builder()
                                                .user(recipient)
                                                .type(type)
                                                .title(title)
                                                .message(message)
                                                .referenceType(referenceType)
                                                .referenceId(referenceId)
                                                .build())
                        .toList();
        notificationRepository.saveAll(notifications);
    }

    private User getRequiredCurrentUser() {
        UserRole membership =
                currentUserService
                        .getCurrentUserRole()
                        .orElseThrow(
                                () ->
                                        new AccessDeniedException(
                                                "Authenticated user context is required"));
        return membership.getUser();
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null) {
            return MAX_LIMIT;
        }
        if (limit <= 0) {
            throw new IllegalArgumentException("Limit must be greater than zero");
        }
        return Math.min(limit, MAX_LIMIT);
    }

    private String resolveDisplayName(User user) {
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName();
        }
        return user.getEmail();
    }

    private String toHumanReadableStatus(String status) {
        return status.replace('_', ' ').toLowerCase(Locale.ROOT);
    }
}
