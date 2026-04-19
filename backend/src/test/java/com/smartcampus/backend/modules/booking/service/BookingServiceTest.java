package com.smartcampus.backend.modules.booking.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.BookingStatus;
import com.smartcampus.backend.common.enums.ResourceStatus;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.common.exception.ResourceConflictException;
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
import com.smartcampus.backend.modules.resource.entity.Location;
import com.smartcampus.backend.modules.resource.entity.Resource;
import com.smartcampus.backend.modules.resource.entity.ResourceAvailabilityWindow;
import com.smartcampus.backend.modules.resource.repository.ResourceAvailabilityWindowRepository;
import com.smartcampus.backend.modules.resource.service.ResourceService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private ResourceService resourceService;
    @Mock private ResourceAvailabilityWindowRepository resourceAvailabilityWindowRepository;
    @Mock private CurrentUserService currentUserService;
    @Mock private BookingMapper bookingMapper;
    @Mock private NotificationService notificationService;

    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        bookingService =
                new BookingService(
                        bookingRepository,
                        resourceService,
                        resourceAvailabilityWindowRepository,
                        currentUserService,
                        bookingMapper,
                        notificationService);
    }

    @Test
    void studentCreatesPendingBookingWhenApprovalIsRequired() {
        User student = buildUser(1L, "student@example.com", "Student User");
        UserRole membership = buildMembership(student, RoleCode.STUDENT);
        Resource resource = buildResource(10L, true, ResourceStatus.ACTIVE);
        CreateBookingRequest request =
                new CreateBookingRequest(
                        10L,
                        LocalDate.now().plusDays(1),
                        LocalTime.of(9, 0),
                        LocalTime.of(10, 0),
                        "Study session",
                        4,
                        "Bring projector");
        BookingDetailResponse response =
                new BookingDetailResponse(
                        100L,
                        10L,
                        "LAB-01",
                        "Lab 1",
                        20L,
                        "Building A",
                        1L,
                        "student@example.com",
                        "Student User",
                        request.bookingDate(),
                        request.startTime(),
                        request.endTime(),
                        request.purpose(),
                        request.expectedAttendees(),
                        request.requestNotes(),
                        BookingStatus.PENDING,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        LocalDateTime.now(),
                        LocalDateTime.now());

        when(currentUserService.getCurrentUserRole()).thenReturn(Optional.of(membership));
        when(resourceService.getManagedResource(10L)).thenReturn(resource);
        when(resourceAvailabilityWindowRepository.findByResource_IdOrderByDayOfWeekAscStartTimeAsc(10L))
                .thenReturn(List.of());
        when(bookingRepository.countOverlappingBookings(
                        eq(10L),
                        eq(request.bookingDate()),
                        eq(request.startTime()),
                        eq(request.endTime()),
                        any(),
                        eq(null)))
                .thenReturn(0L);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingMapper.toDetail(any(Booking.class))).thenReturn(response);

        BookingDetailResponse created = bookingService.create(request);

        ArgumentCaptor<Booking> bookingCaptor = ArgumentCaptor.forClass(Booking.class);
        verify(bookingRepository).save(bookingCaptor.capture());
        assertThat(bookingCaptor.getValue().getStatus()).isEqualTo(BookingStatus.PENDING);
        assertThat(bookingCaptor.getValue().getRequesterUser()).isEqualTo(student);
        verify(notificationService).notifyBookingCreated(bookingCaptor.getValue());
        assertThat(created.status()).isEqualTo(BookingStatus.PENDING);
    }

    @Test
    void adminCreatesAutoApprovedBookingWhenApprovalNotRequired() {
        User admin = buildUser(2L, "admin@example.com", "Admin");
        UserRole membership = buildMembership(admin, RoleCode.ADMIN);
        Resource resource = buildResource(11L, false, ResourceStatus.ACTIVE);
        CreateBookingRequest request =
                new CreateBookingRequest(
                        11L,
                        LocalDate.now().plusDays(2),
                        LocalTime.of(13, 0),
                        LocalTime.of(14, 0),
                        "Event prep",
                        3,
                        null);

        when(currentUserService.getCurrentUserRole()).thenReturn(Optional.of(membership));
        when(resourceService.getManagedResource(11L)).thenReturn(resource);
        when(resourceAvailabilityWindowRepository.findByResource_IdOrderByDayOfWeekAscStartTimeAsc(11L))
                .thenReturn(List.of());
        when(bookingRepository.countOverlappingBookings(
                        eq(11L),
                        eq(request.bookingDate()),
                        eq(request.startTime()),
                        eq(request.endTime()),
                        any(),
                        eq(null)))
                .thenReturn(0L);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingMapper.toDetail(any(Booking.class)))
                .thenReturn(
                        new BookingDetailResponse(
                                101L,
                                11L,
                                "HALL-1",
                                "Hall",
                                20L,
                                "Building A",
                                2L,
                                "admin@example.com",
                                "Admin",
                                request.bookingDate(),
                                request.startTime(),
                                request.endTime(),
                                request.purpose(),
                                request.expectedAttendees(),
                                null,
                                BookingStatus.APPROVED,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                LocalDateTime.now(),
                                LocalDateTime.now()));

        BookingDetailResponse created = bookingService.create(request);

        assertThat(created.status()).isEqualTo(BookingStatus.APPROVED);
        verify(notificationService).notifyBookingCreated(any(Booking.class));
    }

    @Test
    void staffCannotListBookings() {
        when(currentUserService.getCurrentUserRole())
                .thenReturn(Optional.of(buildMembership(buildUser(3L, "staff@example.com", "Staff"), RoleCode.STAFF)));

        assertThatThrownBy(() -> bookingService.getBookings(null, null, null, null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Staff");
    }

    @Test
    void createRejectsOverlapAgainstPendingOrApprovedBookings() {
        User student = buildUser(4L, "student2@example.com", "Student 2");
        UserRole membership = buildMembership(student, RoleCode.STUDENT);
        Resource resource = buildResource(12L, true, ResourceStatus.ACTIVE);
        CreateBookingRequest request =
                new CreateBookingRequest(
                        12L,
                        LocalDate.now().plusDays(1),
                        LocalTime.of(10, 0),
                        LocalTime.of(11, 0),
                        "Club meeting",
                        10,
                        null);

        when(currentUserService.getCurrentUserRole()).thenReturn(Optional.of(membership));
        when(resourceService.getManagedResource(12L)).thenReturn(resource);
        when(resourceAvailabilityWindowRepository.findByResource_IdOrderByDayOfWeekAscStartTimeAsc(12L))
                .thenReturn(List.of());
        when(bookingRepository.countOverlappingBookings(
                        eq(12L),
                        eq(request.bookingDate()),
                        eq(request.startTime()),
                        eq(request.endTime()),
                        any(),
                        eq(null)))
                .thenReturn(1L);

        assertThatThrownBy(() -> bookingService.create(request))
                .isInstanceOf(ResourceConflictException.class)
                .hasMessageContaining("already booked");
    }

    @Test
    void createRejectsWhenRequestedSlotIsOutsideAvailableWindows() {
        User student = buildUser(5L, "student3@example.com", "Student 3");
        UserRole membership = buildMembership(student, RoleCode.STUDENT);
        LocalDate bookingDate = LocalDate.now().plusDays(1);
        Resource resource = buildResource(13L, true, ResourceStatus.ACTIVE);
        ResourceAvailabilityWindow availableWindow =
                ResourceAvailabilityWindow.builder()
                        .resource(resource)
                        .dayOfWeek((short) bookingDate.getDayOfWeek().getValue())
                        .startTime(LocalTime.of(8, 0))
                        .endTime(LocalTime.of(9, 0))
                        .isAvailable(true)
                        .build();
        CreateBookingRequest request =
                new CreateBookingRequest(
                        13L,
                        bookingDate,
                        LocalTime.of(10, 0),
                        LocalTime.of(11, 0),
                        "Practice",
                        2,
                        null);

        when(currentUserService.getCurrentUserRole()).thenReturn(Optional.of(membership));
        when(resourceService.getManagedResource(13L)).thenReturn(resource);
        when(resourceAvailabilityWindowRepository.findByResource_IdOrderByDayOfWeekAscStartTimeAsc(13L))
                .thenReturn(List.of(availableWindow));

        assertThatThrownBy(() -> bookingService.create(request))
                .isInstanceOf(ResourceConflictException.class)
                .hasMessageContaining("outside");
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void createRejectsWhenExpectedAttendeesExceedResourceCapacity() {
        User student = buildUser(50L, "student6@example.com", "Student Six");
        UserRole membership = buildMembership(student, RoleCode.STUDENT);
        Resource resource = buildResource(17L, true, ResourceStatus.ACTIVE);
        resource.setCapacity(20);
        CreateBookingRequest request =
                new CreateBookingRequest(
                        17L,
                        LocalDate.now().plusDays(1),
                        LocalTime.of(11, 0),
                        LocalTime.of(12, 0),
                        "Workshop",
                        25,
                        null);

        when(currentUserService.getCurrentUserRole()).thenReturn(Optional.of(membership));
        when(resourceService.getManagedResource(17L)).thenReturn(resource);

        assertThatThrownBy(() -> bookingService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Exceeded capacity")
                .hasMessageContaining("20");
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void studentCannotReadAnotherUsersBooking() {
        User requester = buildUser(6L, "owner@example.com", "Owner");
        User viewer = buildUser(7L, "viewer@example.com", "Viewer");
        UserRole membership = buildMembership(viewer, RoleCode.STUDENT);
        Booking booking = buildBooking(200L, requester, buildResource(14L, true, ResourceStatus.ACTIVE));

        when(currentUserService.getCurrentUserRole()).thenReturn(Optional.of(membership));
        when(bookingRepository.findDetailedById(200L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.getBookingById(200L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("permission");
    }

    @Test
    void adminRejectRequiresReason() {
        User admin = buildUser(8L, "admin2@example.com", "Admin Two");
        User requester = buildUser(9L, "student4@example.com", "Student Four");
        UserRole membership = buildMembership(admin, RoleCode.ADMIN);
        Booking booking = buildBooking(201L, requester, buildResource(15L, true, ResourceStatus.ACTIVE));

        when(currentUserService.getCurrentUserRole()).thenReturn(Optional.of(membership));
        when(bookingRepository.findById(201L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(
                        () ->
                                bookingService.reviewBooking(
                                        201L, new ReviewBookingRequest(BookingReviewDecision.REJECT, "  ")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("rejection reason");
    }

    @Test
    void requesterCanCancelApprovedBooking() {
        User requester = buildUser(10L, "student5@example.com", "Student Five");
        UserRole membership = buildMembership(requester, RoleCode.STUDENT);
        Booking booking = buildBooking(202L, requester, buildResource(16L, true, ResourceStatus.ACTIVE));
        booking.setStatus(BookingStatus.APPROVED);

        when(currentUserService.getCurrentUserRole()).thenReturn(Optional.of(membership));
        when(bookingRepository.findById(202L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(booking)).thenReturn(booking);
        when(bookingMapper.toDetail(booking))
                .thenReturn(
                        new BookingDetailResponse(
                                202L,
                                16L,
                                "RES-16",
                                "Resource 16",
                                20L,
                                "Building A",
                                10L,
                                "student5@example.com",
                                "Student Five",
                                booking.getBookingDate(),
                                booking.getStartTime(),
                                booking.getEndTime(),
                                booking.getPurpose(),
                                booking.getExpectedAttendees(),
                                booking.getRequestNotes(),
                                BookingStatus.CANCELLED,
                                null,
                                null,
                                null,
                                null,
                                10L,
                                "Student Five",
                                LocalDateTime.now(),
                                "Changed plans",
                                LocalDateTime.now(),
                                LocalDateTime.now()));

        BookingDetailResponse cancelled =
                bookingService.cancelBooking(202L, new CancelBookingRequest("Changed plans"));

        assertThat(cancelled.status()).isEqualTo(BookingStatus.CANCELLED);
        assertThat(booking.getCancelledByUser()).isEqualTo(requester);
        verify(notificationService).notifyBookingCancelled(booking, requester);
    }

    @Test
    void reviewApprovalCreatesRequesterNotification() {
        User admin = buildUser(11L, "admin@example.com", "Admin");
        User requester = buildUser(12L, "student@example.com", "Student");
        UserRole membership = buildMembership(admin, RoleCode.ADMIN);
        Booking booking = buildBooking(203L, requester, buildResource(17L, true, ResourceStatus.ACTIVE));

        when(currentUserService.getCurrentUserRole()).thenReturn(Optional.of(membership));
        when(bookingRepository.findById(203L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(booking)).thenReturn(booking);
        when(bookingMapper.toDetail(booking))
                .thenReturn(
                        new BookingDetailResponse(
                                203L,
                                17L,
                                "RES-17",
                                "Resource 17",
                                20L,
                                "Building A",
                                12L,
                                requester.getEmail(),
                                requester.getDisplayName(),
                                booking.getBookingDate(),
                                booking.getStartTime(),
                                booking.getEndTime(),
                                booking.getPurpose(),
                                booking.getExpectedAttendees(),
                                booking.getRequestNotes(),
                                BookingStatus.APPROVED,
                                admin.getId(),
                                admin.getDisplayName(),
                                LocalDateTime.now(),
                                null,
                                null,
                                null,
                                null,
                                null,
                                LocalDateTime.now(),
                                LocalDateTime.now()));

        bookingService.reviewBooking(203L, new ReviewBookingRequest(BookingReviewDecision.APPROVE, null));

        verify(notificationService).notifyBookingReviewed(booking);
    }

    @Test
    void autoApprovedCreateTriggersBookingNotificationFlow() {
        User admin = buildUser(13L, "admin3@example.com", "Admin Three");
        UserRole membership = buildMembership(admin, RoleCode.ADMIN);
        Resource resource = buildResource(18L, false, ResourceStatus.ACTIVE);
        CreateBookingRequest request =
                new CreateBookingRequest(
                        18L,
                        LocalDate.now().plusDays(3),
                        LocalTime.of(8, 0),
                        LocalTime.of(9, 0),
                        "Setup",
                        2,
                        null);

        when(currentUserService.getCurrentUserRole()).thenReturn(Optional.of(membership));
        when(resourceService.getManagedResource(18L)).thenReturn(resource);
        when(resourceAvailabilityWindowRepository.findByResource_IdOrderByDayOfWeekAscStartTimeAsc(18L))
                .thenReturn(List.of());
        when(bookingRepository.countOverlappingBookings(
                        eq(18L),
                        eq(request.bookingDate()),
                        eq(request.startTime()),
                        eq(request.endTime()),
                        any(),
                        eq(null)))
                .thenReturn(0L);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingMapper.toDetail(any(Booking.class)))
                .thenReturn(
                        new BookingDetailResponse(
                                204L,
                                18L,
                                "RES-18",
                                "Resource 18",
                                20L,
                                "Building A",
                                admin.getId(),
                                admin.getEmail(),
                                admin.getDisplayName(),
                                request.bookingDate(),
                                request.startTime(),
                                request.endTime(),
                                request.purpose(),
                                request.expectedAttendees(),
                                request.requestNotes(),
                                BookingStatus.APPROVED,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                null,
                                LocalDateTime.now(),
                                LocalDateTime.now()));

        bookingService.create(request);

        verify(notificationService).notifyBookingCreated(any(Booking.class));
        verify(notificationService, never()).notifyBookingReviewed(any());
    }

    private User buildUser(Long id, String email, String displayName) {
        return User.builder().id(id).email(email).displayName(displayName).status(UserStatus.ACTIVE).build();
    }

    private UserRole buildMembership(User user, RoleCode roleCode) {
        return UserRole.builder()
                .user(user)
                .role(Role.builder().id(1L).code(roleCode).name(roleCode.name()).build())
                .isActive(true)
                .build();
    }

    private Resource buildResource(Long id, boolean requiresApproval, ResourceStatus status) {
        return Resource.builder()
                .id(id)
                .resourceCode("RES-" + id)
                .name("Resource " + id)
                .location(Location.builder().id(20L).name("Building A").build())
                .requiresApproval(requiresApproval)
                .status(status)
                .build();
    }

    private Booking buildBooking(Long id, User requester, Resource resource) {
        Booking booking =
                Booking.builder()
                        .id(id)
                        .resource(resource)
                        .requesterUser(requester)
                        .bookingDate(LocalDate.now().plusDays(1))
                        .startTime(LocalTime.of(9, 0))
                        .endTime(LocalTime.of(10, 0))
                        .purpose("Purpose")
                        .status(BookingStatus.PENDING)
                        .build();
        booking.setCreatedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());
        return booking;
    }
}
