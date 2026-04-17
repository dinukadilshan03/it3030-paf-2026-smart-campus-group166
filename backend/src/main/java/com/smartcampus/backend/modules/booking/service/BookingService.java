package com.smartcampus.backend.modules.booking.service;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.BookingStatus;
import com.smartcampus.backend.common.enums.ResourceStatus;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.exception.ResourceConflictException;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.modules.auth.service.CurrentUserService;
import com.smartcampus.backend.modules.booking.dto.BookingDetailResponse;
import com.smartcampus.backend.modules.booking.dto.BookingReviewDecision;
import com.smartcampus.backend.modules.booking.dto.BookingSummaryResponse;
import com.smartcampus.backend.modules.booking.dto.CancelBookingRequest;
import com.smartcampus.backend.modules.booking.dto.CreateBookingRequest;
import com.smartcampus.backend.modules.booking.dto.ReviewBookingRequest;
import com.smartcampus.backend.modules.booking.entity.Booking;
import com.smartcampus.backend.modules.booking.mapper.BookingMapper;
import com.smartcampus.backend.modules.booking.repository.BookingRepository;
import com.smartcampus.backend.modules.notification.service.NotificationService;
import com.smartcampus.backend.modules.resource.entity.Resource;
import com.smartcampus.backend.modules.resource.entity.ResourceAvailabilityWindow;
import com.smartcampus.backend.modules.resource.repository.ResourceAvailabilityWindowRepository;
import com.smartcampus.backend.modules.resource.service.ResourceService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final EnumSet<BookingStatus> OVERLAP_IGNORED_STATUSES =
            EnumSet.of(BookingStatus.REJECTED, BookingStatus.CANCELLED);

    private final BookingRepository bookingRepository;
    private final ResourceService resourceService;
    private final ResourceAvailabilityWindowRepository resourceAvailabilityWindowRepository;
    private final CurrentUserService currentUserService;
    private final BookingMapper bookingMapper;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<BookingSummaryResponse> getBookings(
            BookingStatus status,
            Long resourceId,
            Long requesterUserId,
            LocalDate bookingDate) {
        UserRole membership = getRequiredCurrentMembership();
        RoleCode roleCode = membership.getRole().getCode();

        if (roleCode == RoleCode.STAFF) {
            throw new AccessDeniedException("Staff users cannot access bookings");
        }

        List<Booking> bookings =
                roleCode == RoleCode.ADMIN
                        ? bookingRepository.searchBookingsForAdmin(
                                status, resourceId, requesterUserId, bookingDate)
                        : bookingRepository.findVisibleToRequester(
                                membership.getUser().getId(), status, resourceId, bookingDate);

        return bookings.stream().map(bookingMapper::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public BookingDetailResponse getBookingById(Long id) {
        UserRole membership = getRequiredCurrentMembership();
        Booking booking = getDetailedBooking(id);
        ensureCanViewBooking(membership, booking);
        return bookingMapper.toDetail(booking);
    }

    @Transactional
    public BookingDetailResponse create(CreateBookingRequest request) {
        UserRole membership = getRequiredCurrentMembership();
        RoleCode roleCode = membership.getRole().getCode();
        if (roleCode != RoleCode.STUDENT && roleCode != RoleCode.ADMIN) {
            throw new AccessDeniedException("Only students and admins can create bookings");
        }

        validateTimeRange(request.bookingDate(), request.startTime(), request.endTime());
        Resource resource = resourceService.getManagedResource(request.resourceId());
        validateResourceBookable(resource, request.bookingDate(), request.startTime(), request.endTime());
        validateOverlap(resource.getId(), request.bookingDate(), request.startTime(), request.endTime(), null);

        BookingStatus initialStatus =
                Boolean.TRUE.equals(resource.getRequiresApproval())
                        ? BookingStatus.PENDING
                        : BookingStatus.APPROVED;

        Booking booking =
                Booking.builder()
                        .resource(resource)
                        .requesterUser(membership.getUser())
                        .bookingDate(request.bookingDate())
                        .startTime(request.startTime())
                        .endTime(request.endTime())
                        .purpose(request.purpose().trim())
                        .expectedAttendees(request.expectedAttendees())
                        .requestNotes(normalizeOptionalText(request.requestNotes()))
                        .status(initialStatus)
                        .build();

        return bookingMapper.toDetail(bookingRepository.save(booking));
    }

    @Transactional
    public BookingDetailResponse reviewBooking(Long id, ReviewBookingRequest request) {
        UserRole membership = getRequiredCurrentMembership();
        if (membership.getRole().getCode() != RoleCode.ADMIN) {
            throw new AccessDeniedException("Only admins can review bookings");
        }

        Booking booking = getManagedBooking(id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException("Only pending bookings can be reviewed");
        }

        LocalDateTime reviewedAt = LocalDateTime.now();
        booking.setReviewedByUser(membership.getUser());
        booking.setReviewedAt(reviewedAt);

        if (request.decision() == BookingReviewDecision.APPROVE) {
            validateResourceBookable(
                    booking.getResource(),
                    booking.getBookingDate(),
                    booking.getStartTime(),
                    booking.getEndTime());
            validateOverlap(
                    booking.getResource().getId(),
                    booking.getBookingDate(),
                    booking.getStartTime(),
                    booking.getEndTime(),
                    booking.getId());
            booking.setStatus(BookingStatus.APPROVED);
            booking.setReviewReason(null);
        } else {
            if (request.reason() == null || request.reason().isBlank()) {
                throw new IllegalArgumentException("A rejection reason is required");
            }
            booking.setStatus(BookingStatus.REJECTED);
            booking.setReviewReason(request.reason().trim());
        }

        Booking savedBooking = bookingRepository.save(booking);
        notificationService.notifyBookingReviewed(savedBooking);
        return bookingMapper.toDetail(savedBooking);
    }

    @Transactional
    public BookingDetailResponse cancelBooking(Long id, CancelBookingRequest request) {
        UserRole membership = getRequiredCurrentMembership();
        Booking booking = getManagedBooking(id);

        boolean isAdmin = membership.getRole().getCode() == RoleCode.ADMIN;
        boolean isRequester = booking.getRequesterUser().getId().equals(membership.getUser().getId());
        if (!isAdmin && !isRequester) {
            throw new AccessDeniedException("You do not have permission to cancel this booking");
        }

        if (booking.getStatus() != BookingStatus.PENDING
                && booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalArgumentException("Only pending or approved bookings can be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledByUser(membership.getUser());
        booking.setCancelledAt(LocalDateTime.now());
        booking.setCancellationReason(
                request == null ? null : normalizeOptionalText(request.reason()));

        return bookingMapper.toDetail(bookingRepository.save(booking));
    }

    private Booking getManagedBooking(Long id) {
        return bookingRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found for id: " + id));
    }

    private Booking getDetailedBooking(Long id) {
        return bookingRepository
                .findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found for id: " + id));
    }

    private void ensureCanViewBooking(UserRole membership, Booking booking) {
        RoleCode roleCode = membership.getRole().getCode();
        if (roleCode == RoleCode.ADMIN) {
            return;
        }
        if (roleCode == RoleCode.STUDENT
                && booking.getRequesterUser().getId().equals(membership.getUser().getId())) {
            return;
        }
        throw new AccessDeniedException("You do not have permission to access this booking");
    }

    private void validateTimeRange(LocalDate bookingDate, java.time.LocalTime startTime, java.time.LocalTime endTime) {
        if (bookingDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Booking date must be today or later");
        }
        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("Start time must be earlier than end time");
        }
    }

    private void validateResourceBookable(
            Resource resource,
            LocalDate bookingDate,
            java.time.LocalTime startTime,
            java.time.LocalTime endTime) {
        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new ResourceConflictException("Resource is not currently bookable");
        }

        List<ResourceAvailabilityWindow> matchingWindows =
                resourceAvailabilityWindowRepository.findByResource_IdOrderByDayOfWeekAscStartTimeAsc(
                                resource.getId())
                        .stream()
                        .filter(window -> window.getDayOfWeek() == bookingDate.getDayOfWeek().getValue())
                        .filter(window -> appliesOnDate(window, bookingDate))
                        .toList();

        if (matchingWindows.isEmpty()) {
            return;
        }

        boolean blockedByUnavailableWindow =
                matchingWindows.stream()
                        .filter(window -> Boolean.FALSE.equals(window.getIsAvailable()))
                        .anyMatch(window -> overlaps(window, startTime, endTime));
        if (blockedByUnavailableWindow) {
            throw new ResourceConflictException(
                    "Requested booking time falls inside an unavailable window");
        }

        boolean fitsAvailableWindow =
                matchingWindows.stream()
                        .filter(window -> Boolean.TRUE.equals(window.getIsAvailable()))
                        .anyMatch(window -> fitsWithin(window, startTime, endTime));
        if (!fitsAvailableWindow) {
            throw new ResourceConflictException(
                    "Requested booking time is outside the configured availability windows");
        }
    }

    private boolean appliesOnDate(ResourceAvailabilityWindow window, LocalDate bookingDate) {
        boolean afterStart =
                window.getEffectiveFrom() == null || !bookingDate.isBefore(window.getEffectiveFrom());
        boolean beforeEnd =
                window.getEffectiveTo() == null || !bookingDate.isAfter(window.getEffectiveTo());
        return afterStart && beforeEnd;
    }

    private boolean overlaps(
            ResourceAvailabilityWindow window,
            java.time.LocalTime startTime,
            java.time.LocalTime endTime) {
        return window.getStartTime().isBefore(endTime) && window.getEndTime().isAfter(startTime);
    }

    private boolean fitsWithin(
            ResourceAvailabilityWindow window,
            java.time.LocalTime startTime,
            java.time.LocalTime endTime) {
        return !startTime.isBefore(window.getStartTime()) && !endTime.isAfter(window.getEndTime());
    }

    private void validateOverlap(
            Long resourceId,
            LocalDate bookingDate,
            java.time.LocalTime startTime,
            java.time.LocalTime endTime,
            Long excludeBookingId) {
        long overlaps =
                bookingRepository.countOverlappingBookings(
                        resourceId,
                        bookingDate,
                        startTime,
                        endTime,
                        OVERLAP_IGNORED_STATUSES,
                        excludeBookingId);
        if (overlaps > 0) {
            throw new ResourceConflictException(
                    "Resource is already booked for the requested time range");
        }
    }

    private UserRole getRequiredCurrentMembership() {
        return currentUserService
                .getCurrentUserRole()
                .orElseThrow(() -> new AccessDeniedException("Authenticated user context is required"));
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
