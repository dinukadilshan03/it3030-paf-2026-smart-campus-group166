package com.smartcampus.backend.modules.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.CommentType;
import com.smartcampus.backend.common.enums.NotificationType;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.TicketStatus;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.modules.auth.service.CurrentUserService;
import com.smartcampus.backend.modules.booking.entity.Booking;
import com.smartcampus.backend.modules.notification.entity.Notification;
import com.smartcampus.backend.modules.notification.mapper.NotificationMapper;
import com.smartcampus.backend.modules.notification.repository.NotificationRepository;
import com.smartcampus.backend.modules.resource.entity.Location;
import com.smartcampus.backend.modules.resource.entity.Resource;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketCategory;
import com.smartcampus.backend.modules.ticket.entity.TicketComment;
import com.smartcampus.backend.modules.user.repository.UserRoleRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private CurrentUserService currentUserService;
    @Mock private UserRoleRepository userRoleRepository;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService =
                new NotificationService(
                        notificationRepository,
                        currentUserService,
                        new NotificationMapper(),
                        userRoleRepository);
    }

    @Test
    void ticketStatusNotificationDeduplicatesReporterAndAssigneeAndExcludesActor() {
        User sharedUser = buildUser(1L, "shared@example.com", "Shared User");
        Ticket ticket = buildTicket(10L, sharedUser);
        ticket.setAssignedStaffUser(sharedUser);

        notificationService.notifyTicketStatusChanged(ticket, TicketStatus.RESOLVED, sharedUser, sharedUser);

        verify(notificationRepository, never()).saveAll(any());
    }

    @Test
    void ticketStatusNotificationSkipsNullAssignedStaffSnapshot() {
        User reporter = buildUser(3L, "reporter@example.com", "Reporter");
        User admin = buildUser(4L, "admin@example.com", "Admin");
        Ticket ticket = buildTicket(13L, reporter);

        notificationService.notifyTicketStatusChanged(ticket, TicketStatus.REJECTED, admin, null);

        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).singleElement().satisfies(notification -> {
            assertThat(notification.getUser()).isEqualTo(reporter);
            assertThat(notification.getType()).isEqualTo(NotificationType.TICKET);
            assertThat(notification.getTitle()).isEqualTo("Ticket status updated");
        });
    }

    @Test
    void publicCommentNotifiesReporterAndAssignedStaffExceptAuthor() {
        User reporter = buildUser(1L, "reporter@example.com", "Reporter");
        User staff = buildUser(2L, "staff@example.com", "Staff");
        Ticket ticket = buildTicket(11L, reporter);
        ticket.setAssignedStaffUser(staff);
        TicketComment comment =
                TicketComment.builder()
                        .id(50L)
                        .ticket(ticket)
                        .authorUser(staff)
                        .body("Checking now")
                        .commentType(CommentType.PUBLIC_REPLY)
                        .build();

        notificationService.notifyTicketCommentAdded(ticket, comment);

        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(1);
        assertThat(captor.getValue().getFirst().getUser()).isEqualTo(reporter);
        assertThat(captor.getValue().getFirst().getType()).isEqualTo(NotificationType.COMMENT);
    }

    @Test
    void internalNoteDoesNotNotifyReporter() {
        User reporter = buildUser(1L, "reporter@example.com", "Reporter");
        User staff = buildUser(2L, "staff@example.com", "Staff");
        Ticket ticket = buildTicket(12L, reporter);
        ticket.setAssignedStaffUser(staff);
        TicketComment comment =
                TicketComment.builder()
                        .ticket(ticket)
                        .authorUser(buildUser(3L, "admin@example.com", "Admin"))
                        .body("Internal note")
                        .commentType(CommentType.INTERNAL_NOTE)
                        .build();

        notificationService.notifyTicketCommentAdded(ticket, comment);

        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).singleElement().satisfies(notification -> {
            assertThat(notification.getUser()).isEqualTo(staff);
            assertThat(notification.getType()).isEqualTo(NotificationType.COMMENT);
        });
    }

    @Test
    void markAsReadRequiresOwnership() {
        User currentUser = buildUser(10L, "current@example.com", "Current");
        when(currentUserService.getCurrentUserRole())
                .thenReturn(Optional.of(buildMembership(currentUser, RoleCode.STUDENT)));
        when(notificationRepository.findByIdAndUser_Id(99L, 10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markAsRead(99L))
                .isInstanceOf(com.smartcampus.backend.common.exception.ResourceNotFoundException.class)
                .hasMessageContaining("Notification not found");
    }

    @Test
    void markAllAsReadOnlyTouchesCurrentUsersUnreadNotifications() {
        User currentUser = buildUser(10L, "current@example.com", "Current");
        Notification notification =
                Notification.builder()
                        .id(1L)
                        .user(currentUser)
                        .type(NotificationType.BOOKING)
                        .title("Booking approved")
                        .message("Booking updated")
                        .build();
        when(currentUserService.getCurrentUserRole())
                .thenReturn(Optional.of(buildMembership(currentUser, RoleCode.STUDENT)));
        when(notificationRepository.findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(10L))
                .thenReturn(List.of(notification));

        notificationService.markAllAsRead();

        assertThat(notification.getIsRead()).isTrue();
        assertThat(notification.getReadAt()).isNotNull();
        verify(notificationRepository).saveAll(List.of(notification));
    }

    @Test
    void bookingReviewNotificationTargetsRequester() {
        User requester = buildUser(20L, "requester@example.com", "Requester");
        Booking booking =
                Booking.builder()
                        .id(30L)
                        .requesterUser(requester)
                        .resource(
                                Resource.builder()
                                        .id(40L)
                                        .name("Computer Lab")
                                        .location(Location.builder().id(50L).name("Block A").build())
                                        .build())
                        .bookingDate(LocalDate.now().plusDays(1))
                        .startTime(LocalTime.of(9, 0))
                        .endTime(LocalTime.of(10, 0))
                        .status(com.smartcampus.backend.common.enums.BookingStatus.APPROVED)
                        .build();

        notificationService.notifyBookingReviewed(booking);

        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).singleElement().satisfies(notification -> {
            assertThat(notification.getUser()).isEqualTo(requester);
            assertThat(notification.getType()).isEqualTo(NotificationType.BOOKING);
        });
    }

    @Test
    void pendingBookingCreationNotifiesAdmins() {
        User requester = buildUser(21L, "requester2@example.com", "Requester 2");
        User admin = buildUser(22L, "admin@example.com", "Admin");
        Booking booking = buildBooking(31L, requester, com.smartcampus.backend.common.enums.BookingStatus.PENDING);

        when(userRoleRepository.findActiveUsersByRoleAndStatus(RoleCode.ADMIN, UserStatus.ACTIVE))
                .thenReturn(List.of(admin));

        notificationService.notifyBookingCreated(booking);

        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).singleElement().satisfies(notification -> {
            assertThat(notification.getUser()).isEqualTo(admin);
            assertThat(notification.getTitle()).isEqualTo("Booking request submitted");
        });
    }

    @Test
    void approvedBookingCreationNotifiesRequester() {
        User requester = buildUser(23L, "requester3@example.com", "Requester 3");
        Booking booking =
                buildBooking(32L, requester, com.smartcampus.backend.common.enums.BookingStatus.APPROVED);

        notificationService.notifyBookingCreated(booking);

        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).singleElement().satisfies(notification -> {
            assertThat(notification.getUser()).isEqualTo(requester);
            assertThat(notification.getTitle()).isEqualTo("Booking confirmed");
        });
    }

    @Test
    void requesterCancellationNotifiesAdmins() {
        User requester = buildUser(24L, "requester4@example.com", "Requester 4");
        User admin = buildUser(25L, "admin2@example.com", "Admin 2");
        Booking booking =
                buildBooking(33L, requester, com.smartcampus.backend.common.enums.BookingStatus.CANCELLED);

        when(userRoleRepository.findActiveUsersByRoleAndStatus(RoleCode.ADMIN, UserStatus.ACTIVE))
                .thenReturn(List.of(admin));

        notificationService.notifyBookingCancelled(booking, requester);

        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).singleElement().satisfies(notification -> {
            assertThat(notification.getUser()).isEqualTo(admin);
            assertThat(notification.getTitle()).isEqualTo("Booking cancelled");
        });
    }

    @Test
    void adminCancellationNotifiesRequester() {
        User requester = buildUser(26L, "requester5@example.com", "Requester 5");
        User admin = buildUser(27L, "admin3@example.com", "Admin 3");
        Booking booking =
                buildBooking(34L, requester, com.smartcampus.backend.common.enums.BookingStatus.CANCELLED);

        notificationService.notifyBookingCancelled(booking, admin);

        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).singleElement().satisfies(notification -> {
            assertThat(notification.getUser()).isEqualTo(requester);
            assertThat(notification.getMessage()).contains("Admin 3 cancelled");
        });
    }

    @Test
    void ticketCreationNotifiesAdmins() {
        User reporter = buildUser(30L, "reporter2@example.com", "Reporter 2");
        User admin = buildUser(31L, "admin4@example.com", "Admin 4");
        Ticket ticket = buildTicket(13L, reporter);

        when(userRoleRepository.findActiveUsersByRoleAndStatus(RoleCode.ADMIN, UserStatus.ACTIVE))
                .thenReturn(List.of(admin));

        notificationService.notifyTicketCreated(ticket);

        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).singleElement().satisfies(notification -> {
            assertThat(notification.getUser()).isEqualTo(admin);
            assertThat(notification.getTitle()).isEqualTo("New ticket submitted");
        });
    }

    @Test
    void ticketAssignmentNotifiesAssignedStaffOnly() {
        User admin = buildUser(32L, "admin5@example.com", "Admin 5");
        User reporter = buildUser(33L, "reporter3@example.com", "Reporter 3");
        User assigned = buildUser(34L, "staff2@example.com", "Staff 2");
        Ticket ticket = buildTicket(14L, reporter);
        ticket.setAssignedStaffUser(assigned);

        notificationService.notifyTicketAssigned(ticket, admin, null);

        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).singleElement().satisfies(notification -> {
            assertThat(notification.getUser()).isEqualTo(assigned);
            assertThat(notification.getTitle()).isEqualTo("Ticket assigned");
        });
    }

    @Test
    void reconsiderationRequestNotifiesAdmins() {
        User reporter = buildUser(35L, "reporter4@example.com", "Reporter 4");
        User admin = buildUser(36L, "admin6@example.com", "Admin 6");
        Ticket ticket = buildTicket(15L, reporter);

        when(userRoleRepository.findActiveUsersByRoleAndStatus(RoleCode.ADMIN, UserStatus.ACTIVE))
                .thenReturn(List.of(admin));

        notificationService.notifyTicketReconsiderationRequested(ticket);

        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).singleElement().satisfies(notification -> {
            assertThat(notification.getUser()).isEqualTo(admin);
            assertThat(notification.getTitle()).isEqualTo("Ticket reconsideration requested");
        });
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

    private Ticket buildTicket(Long id, User reporter) {
        return Ticket.builder()
                .id(id)
                .ticketNumber("TCK-TEST-" + id)
                .reporterUser(reporter)
                .ticketCategory(TicketCategory.builder().id(1L).code("IT").name("IT").build())
                .title("Issue")
                .description("Desc")
                .status(TicketStatus.OPEN)
                .build();
    }

    private Booking buildBooking(
            Long id, User requester, com.smartcampus.backend.common.enums.BookingStatus status) {
        return Booking.builder()
                .id(id)
                .requesterUser(requester)
                .resource(
                        Resource.builder()
                                .id(40L)
                                .name("Computer Lab")
                                .location(Location.builder().id(50L).name("Block A").build())
                                .build())
                .bookingDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(10, 0))
                .status(status)
                .build();
    }
}
