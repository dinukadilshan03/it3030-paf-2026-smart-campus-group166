package com.smartcampus.backend.modules.ticket.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.TicketPriority;
import com.smartcampus.backend.common.enums.TicketStatus;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.common.exception.ResourceConflictException;
import com.smartcampus.backend.modules.notification.service.NotificationService;
import com.smartcampus.backend.modules.resource.entity.Location;
import com.smartcampus.backend.modules.resource.entity.Resource;
import com.smartcampus.backend.modules.resource.service.LocationService;
import com.smartcampus.backend.modules.resource.service.ResourceService;
import com.smartcampus.backend.modules.ticket.dto.CreateTicketRequest;
import com.smartcampus.backend.modules.ticket.dto.RequestTicketReconsiderationRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketDetailResponse;
import com.smartcampus.backend.modules.ticket.dto.UpdateTicketAssignmentRequest;
import com.smartcampus.backend.modules.ticket.dto.UpdateTicketStatusRequest;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketAssignment;
import com.smartcampus.backend.modules.ticket.entity.TicketCategory;
import com.smartcampus.backend.modules.ticket.mapper.TicketMapper;
import com.smartcampus.backend.modules.ticket.repository.TicketAssignmentRepository;
import com.smartcampus.backend.modules.ticket.repository.TicketRepository;
import com.smartcampus.backend.modules.user.repository.UserRepository;
import com.smartcampus.backend.modules.user.repository.UserRoleRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock private TicketRepository ticketRepository;
    @Mock private TicketAssignmentRepository ticketAssignmentRepository;
    @Mock private TicketCategoryService ticketCategoryService;
    @Mock private TicketCommentService ticketCommentService;
    @Mock private TicketAttachmentService ticketAttachmentService;
    @Mock private ResourceService resourceService;
    @Mock private LocationService locationService;
    @Mock private TicketAccessService ticketAccessService;
    @Mock private UserRepository userRepository;
    @Mock private UserRoleRepository userRoleRepository;
    @Mock private TicketSlaService ticketSlaService;
    @Mock private NotificationService notificationService;

    private TicketService ticketService;

    @BeforeEach
    void setUp() {
        ticketService =
                new TicketService(
                        ticketRepository,
                        ticketAssignmentRepository,
                        ticketCategoryService,
                        ticketCommentService,
                        ticketAttachmentService,
                        resourceService,
                        locationService,
                        ticketAccessService,
                        userRepository,
                        userRoleRepository,
                        ticketSlaService,
                        new TicketMapper(),
                        notificationService);
    }

    @Test
    void createDefaultsPriorityAndStatusAndUsesResourceLocationWhenMissing() {
        User reporter = buildUser(1L, "student@example.com", "Student");
        UserRole membership = buildMembership(reporter, RoleCode.STUDENT);
        TicketCategory category = TicketCategory.builder().id(10L).code("IT").name("IT").isActive(true).build();
        Location location = Location.builder().id(20L).name("Library").build();
        Resource resource =
                Resource.builder().id(30L).resourceCode("PC-1").name("Computer").location(location).build();

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketCategoryService.getManagedCategory(10L)).thenReturn(category);
        when(resourceService.getManagedResource(30L)).thenReturn(resource);
        when(ticketRepository.existsByTicketNumber(any())).thenReturn(false);
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TicketDetailResponse response =
                ticketService.create(
                        new CreateTicketRequest(
                                null,
                                30L,
                                null,
                                10L,
                                "Broken PC",
                                "Will not boot",
                                TicketPriority.MEDIUM,
                                null,
                                null,
                                null));

        assertThat(response.priority()).isEqualTo(TicketPriority.MEDIUM);
        assertThat(response.status()).isEqualTo(TicketStatus.OPEN);
        assertThat(response.locationId()).isEqualTo(20L);
        verify(notificationService).notifyTicketCreated(any(Ticket.class));
    }

    @Test
    void createRejectsInconsistentResourceAndLocation() {
        User reporter = buildUser(2L, "student2@example.com", "Student Two");
        UserRole membership = buildMembership(reporter, RoleCode.STUDENT);
        TicketCategory category = TicketCategory.builder().id(11L).code("OPS").name("Ops").isActive(true).build();
        Resource resource =
                Resource.builder()
                        .id(31L)
                        .resourceCode("PRJ-1")
                        .name("Projector")
                        .location(Location.builder().id(21L).name("Hall A").build())
                        .build();
        Location wrongLocation = Location.builder().id(22L).name("Hall B").build();

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketCategoryService.getManagedCategory(11L)).thenReturn(category);
        when(resourceService.getManagedResource(31L)).thenReturn(resource);
        when(locationService.getManagedLocation(22L)).thenReturn(wrongLocation);

        assertThatThrownBy(
                        () ->
                                ticketService.create(
                                        new CreateTicketRequest(
                                                null,
                                                31L,
                                                22L,
                                                11L,
                                                "Projector issue",
                                                "No signal",
                                                TicketPriority.HIGH,
                                                null,
                                                null,
                                                null)))
                .isInstanceOf(ResourceConflictException.class)
                .hasMessageContaining("same location");
    }

    @Test
    void assignmentRequiresActiveStaffRole() {
        User admin = buildUser(3L, "admin@example.com", "Admin");
        UserRole membership = buildMembership(admin, RoleCode.ADMIN);
        Ticket ticket = buildTicket(100L, buildUser(4L, "reporter@example.com", "Reporter"));
        User target = buildUser(5L, "student-target@example.com", "Student Target");

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketRepository.findById(100L)).thenReturn(Optional.of(ticket));
        when(userRepository.findById(5L)).thenReturn(Optional.of(target));
        when(userRoleRepository.findActiveByUserId(5L))
                .thenReturn(Optional.of(buildMembership(target, RoleCode.STUDENT)));

        assertThatThrownBy(
                        () ->
                                ticketService.updateAssignment(
                                        100L, new UpdateTicketAssignmentRequest(5L, "Please handle")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("STAFF role");
    }

    @Test
    void staffCannotRejectTicket() {
        User staff = buildUser(6L, "staff@example.com", "Staff");
        UserRole membership = buildMembership(staff, RoleCode.STAFF);
        Ticket ticket = buildTicket(101L, buildUser(7L, "reporter2@example.com", "Reporter 2"));
        ticket.setAssignedStaffUser(staff);
        ticket.setStatus(TicketStatus.OPEN);

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketRepository.findById(101L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(
                        () ->
                                ticketService.updateStatus(
                                        101L,
                                        new UpdateTicketStatusRequest(
                                                TicketStatus.REJECTED, null, "Invalid request")))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only admins");
    }

    @Test
    void statusUpdateCreatesSystemNote() {
        User staff = buildUser(8L, "staff2@example.com", "Staff 2");
        UserRole membership = buildMembership(staff, RoleCode.STAFF);
        Ticket ticket = buildTicket(102L, buildUser(9L, "reporter3@example.com", "Reporter 3"));
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setAssignedStaffUser(staff);

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketRepository.findById(102L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(ticket)).thenReturn(ticket);
        when(ticketRepository.findDetailedById(102L)).thenReturn(Optional.of(ticket));
        when(ticketAssignmentRepository.findByTicketIdOrderByAssignedAtDesc(102L)).thenReturn(List.of());

        TicketDetailResponse response =
                ticketService.updateStatus(
                        102L,
                        new UpdateTicketStatusRequest(TicketStatus.IN_PROGRESS, null, null));

        assertThat(response.status()).isEqualTo(TicketStatus.IN_PROGRESS);
        assertThat(response.staffReviewCount()).isEqualTo(1);
        verify(ticketSlaService).markFirstResponseIfNeeded(ticket);
        verify(ticketCommentService).createSystemStatusNote(any(Ticket.class), any(String.class), any(User.class));
        verify(notificationService).notifyTicketStatusChanged(ticket, TicketStatus.IN_PROGRESS, staff, staff);
    }

    @Test
    void adminCannotMoveTicketIntoProgress() {
        User admin = buildUser(10L, "admin3@example.com", "Admin 3");
        UserRole membership = buildMembership(admin, RoleCode.ADMIN);
        Ticket ticket = buildTicket(103L, buildUser(11L, "reporter4@example.com", "Reporter 4"));
        ticket.setStatus(TicketStatus.OPEN);

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketRepository.findById(103L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(
                        () ->
                                ticketService.updateStatus(
                                        103L,
                                        new UpdateTicketStatusRequest(TicketStatus.IN_PROGRESS, null, null)))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Admins can only reject tickets or close resolved work");
    }

    @Test
    void adminCannotCreateTicket() {
        User admin = buildUser(20L, "admin4@example.com", "Admin 4");
        UserRole membership = buildMembership(admin, RoleCode.ADMIN);

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);

        assertThatThrownBy(
                        () ->
                                ticketService.create(
                                        new CreateTicketRequest(
                                                21L,
                                                null,
                                                40L,
                                                13L,
                                                "Network outage",
                                                "No internet connectivity in the lab",
                                                TicketPriority.HIGH,
                                                "Student 4",
                                                "student4@example.com",
                                                "0771234567")))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Admins cannot create tickets");
    }

    @Test
    void adminCannotEditStudentTicket() {
        User admin = buildUser(20L, "admin4@example.com", "Admin 4");
        User reporter = buildUser(21L, "student4@example.com", "Student 4");
        UserRole membership = buildMembership(admin, RoleCode.ADMIN);
        Ticket ticket = buildTicket(149L, reporter);

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketRepository.findById(149L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(
                        () ->
                                ticketService.updateTicket(
                                        149L,
                                        new com.smartcampus.backend.modules.ticket.dto.UpdateTicketRequest(
                                                null,
                                                30L,
                                                12L,
                                                "Updated title",
                                                "Updated description",
                                                TicketPriority.MEDIUM,
                                                null,
                                                null,
                                                null)))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("view tickets");
    }

    @Test
    void reporterCanEditOwnOpenTicket() {
        User reporter = buildUser(30L, "staff-reporter@example.com", "Staff Reporter");
        UserRole membership = buildMembership(reporter, RoleCode.STAFF);
        Ticket ticket = buildTicket(150L, reporter);
        TicketCategory category =
                TicketCategory.builder().id(14L).code("ELECTRICAL").name("Electrical").isActive(true).build();
        Location location = Location.builder().id(41L).name("Hall B").build();

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketRepository.findById(150L)).thenReturn(Optional.of(ticket));
        when(ticketCategoryService.getManagedCategory(14L)).thenReturn(category);
        when(locationService.getManagedLocation(41L)).thenReturn(location);
        when(ticketRepository.save(ticket)).thenReturn(ticket);
        when(ticketRepository.findDetailedById(150L)).thenReturn(Optional.of(ticket));
        when(ticketAssignmentRepository.findByTicketIdOrderByAssignedAtDesc(150L)).thenReturn(List.of());

        TicketDetailResponse response =
                ticketService.updateTicket(
                        150L,
                        new com.smartcampus.backend.modules.ticket.dto.UpdateTicketRequest(
                                null,
                                41L,
                                14L,
                                "Lighting issue",
                                "Ceiling light is not working",
                                TicketPriority.MEDIUM,
                                "Staff Reporter",
                                "staff-reporter@example.com",
                                "0710000000"));

        assertThat(response.title()).isEqualTo("Lighting issue");
        verify(ticketCommentService).createSystemStatusNote(ticket, "Ticket details updated", reporter);
    }

    @Test
    void reporterCannotEditTicketAfterWorkHasStarted() {
        User reporter = buildUser(31L, "student5@example.com", "Student 5");
        UserRole membership = buildMembership(reporter, RoleCode.STUDENT);
        Ticket ticket = buildTicket(151L, reporter);
        ticket.setStatus(TicketStatus.IN_PROGRESS);

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketRepository.findById(151L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(
                        () ->
                                ticketService.updateTicket(
                                        151L,
                                        new com.smartcampus.backend.modules.ticket.dto.UpdateTicketRequest(
                                                null,
                                                30L,
                                                12L,
                                                "Updated",
                                                "Updated description",
                                                TicketPriority.MEDIUM,
                                                null,
                                                null,
                                                null)))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("open ticket");
    }

    @Test
    void reporterCanWithdrawOwnOpenTicket() {
        User reporter = buildUser(32L, "student6@example.com", "Student 6");
        UserRole membership = buildMembership(reporter, RoleCode.STUDENT);
        Ticket ticket = buildTicket(152L, reporter);

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketRepository.findById(152L)).thenReturn(Optional.of(ticket));

        ticketService.deleteTicket(152L);

        verify(ticketAttachmentService).deleteAllForTicket(ticket);
        verify(ticketRepository).delete(ticket);
    }

    @Test
    void adminCannotDeleteOpenTicket() {
        User admin = buildUser(34L, "admin-delete@example.com", "Admin Delete");
        UserRole membership = buildMembership(admin, RoleCode.ADMIN);
        Ticket ticket = buildTicket(154L, buildUser(35L, "student-delete@example.com", "Student Delete"));

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketRepository.findById(154L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.deleteTicket(154L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Admins cannot delete tickets");
        verify(ticketRepository, never()).delete(any(Ticket.class));
    }

    @Test
    void reporterCannotWithdrawProcessedTicket() {
        User reporter = buildUser(33L, "student7@example.com", "Student 7");
        UserRole membership = buildMembership(reporter, RoleCode.STUDENT);
        Ticket ticket = buildTicket(153L, reporter);
        ticket.setStatus(TicketStatus.RESOLVED);

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketRepository.findById(153L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.deleteTicket(153L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("open tickets");
        verify(ticketRepository, never()).delete(any(Ticket.class));
    }

    @Test
    void closingTicketNotifiesPreCloseAssignedStaff() {
        User admin = buildUser(40L, "admin-close@example.com", "Admin Close");
        User staff = buildUser(41L, "staff-close@example.com", "Staff Close");
        User reporter = buildUser(42L, "reporter-close@example.com", "Reporter Close");
        UserRole membership = buildMembership(admin, RoleCode.ADMIN);
        Ticket ticket = buildTicket(160L, reporter);
        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setAssignedStaffUser(staff);
        TicketAssignment activeAssignment =
                TicketAssignment.builder()
                        .id(200L)
                        .ticket(ticket)
                        .assignedToUser(staff)
                        .assignedByUser(admin)
                        .isActive(true)
                        .build();

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketRepository.findById(160L)).thenReturn(Optional.of(ticket));
        when(ticketAssignmentRepository.findActiveByTicketId(160L)).thenReturn(Optional.of(activeAssignment));
        when(ticketRepository.save(ticket)).thenReturn(ticket);
        when(ticketRepository.findDetailedById(160L)).thenReturn(Optional.of(ticket));
        when(ticketAssignmentRepository.findByTicketIdOrderByAssignedAtDesc(160L))
                .thenReturn(List.of(activeAssignment));

        ticketService.updateStatus(160L, new UpdateTicketStatusRequest(TicketStatus.CLOSED, null, null));

        verify(notificationService).notifyTicketStatusChanged(ticket, TicketStatus.CLOSED, admin, staff);
    }

    @Test
    void studentCanRequestReconsiderationForRejectedTicket() {
        User reporter = buildUser(50L, "student-reconsider@example.com", "Student Reconsider");
        UserRole membership = buildMembership(reporter, RoleCode.STUDENT);
        Ticket ticket = buildTicket(170L, reporter);
        ticket.setStatus(TicketStatus.REJECTED);
        ticket.setRejectionReason("Duplicate request");
        ticket.setRejectedAt(LocalDateTime.now().minusHours(2));

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketRepository.findById(170L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(ticket)).thenReturn(ticket);
        when(ticketRepository.findDetailedById(170L)).thenReturn(Optional.of(ticket));
        when(ticketAssignmentRepository.findByTicketIdOrderByAssignedAtDesc(170L)).thenReturn(List.of());

        TicketDetailResponse response =
                ticketService.requestReconsideration(
                        170L,
                        new com.smartcampus.backend.modules.ticket.dto.RequestTicketReconsiderationRequest(
                                "Please review this again. It is a different room issue."));

        assertThat(response.reconsiderationNote()).contains("different room issue");
        assertThat(response.reconsiderationRequestCount()).isEqualTo(1);
        verify(ticketCommentService)
                .createSystemStatusNote(ticket, "Student requested reconsideration review", reporter);
        verify(notificationService).notifyTicketReconsiderationRequested(ticket);
    }

    @Test
    void studentCannotRequestReconsiderationMoreThanOnce() {
        User reporter = buildUser(51L, "student-reconsider-twice@example.com", "Student Reconsider Twice");
        UserRole membership = buildMembership(reporter, RoleCode.STUDENT);
        Ticket ticket = buildTicket(1701L, reporter);
        ticket.setStatus(TicketStatus.REJECTED);
        ticket.setRejectionReason("Duplicate request");
        ticket.setRejectedAt(LocalDateTime.now().minusHours(2));
        ticket.setReconsiderationRequestCount(1);
        ticket.setReconsiderationRequestedAt(LocalDateTime.now().minusMinutes(20));

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketRepository.findById(1701L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(
                        () ->
                                ticketService.requestReconsideration(
                                        1701L,
                                        new RequestTicketReconsiderationRequest(
                                                "Please review this again.")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only one reconsideration request");
    }

    @Test
    void staffReporterCannotRequestReconsideration() {
        User reporter = buildUser(52L, "staff-reconsider@example.com", "Staff Reconsider");
        UserRole membership = buildMembership(reporter, RoleCode.STAFF);
        Ticket ticket = buildTicket(1703L, reporter);
        ticket.setStatus(TicketStatus.REJECTED);
        ticket.setRejectionReason("Invalid request");
        ticket.setRejectedAt(LocalDateTime.now().minusHours(1));

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketRepository.findById(1703L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(
                        () ->
                                ticketService.requestReconsideration(
                                        1703L,
                                        new RequestTicketReconsiderationRequest(
                                                "Please review this again.")))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only students can ask admin");
    }

    @Test
    void adminCanRejectPendingReconsiderationWithoutReopeningTicket() {
        User admin = buildUser(55L, "admin-second-reject@example.com", "Admin Second Reject");
        User reporter = buildUser(56L, "student-second-reject@example.com", "Student Second Reject");
        UserRole membership = buildMembership(admin, RoleCode.ADMIN);
        Ticket ticket = buildTicket(1702L, reporter);
        ticket.setStatus(TicketStatus.REJECTED);
        ticket.setRejectionReason("Duplicate request");
        ticket.setRejectedAt(LocalDateTime.now().minusHours(2));
        ticket.setReconsiderationNote("This is a different issue.");
        ticket.setReconsiderationRequestedAt(LocalDateTime.now().minusMinutes(30));

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketRepository.findById(1702L)).thenReturn(Optional.of(ticket));
        when(ticketAssignmentRepository.findActiveByTicketId(1702L)).thenReturn(Optional.empty());
        when(ticketRepository.save(ticket)).thenReturn(ticket);
        when(ticketRepository.findDetailedById(1702L)).thenReturn(Optional.of(ticket));
        when(ticketAssignmentRepository.findByTicketIdOrderByAssignedAtDesc(1702L)).thenReturn(List.of());

        TicketDetailResponse response =
                ticketService.updateStatus(
                        1702L,
                        new UpdateTicketStatusRequest(
                                TicketStatus.REJECTED, null, "Still rejected after review"));

        assertThat(response.status()).isEqualTo(TicketStatus.REJECTED);
        assertThat(response.rejectionReason()).isEqualTo("Still rejected after review");
        assertThat(response.adminReviewCount()).isEqualTo(1);
        assertThat(response.reconsiderationReviewedAt()).isNotNull();
        verify(ticketCommentService)
                .createSystemStatusNote(ticket, "Reconsideration request reviewed and rejected", admin);
        verify(notificationService).notifyTicketStatusChanged(ticket, TicketStatus.REJECTED, admin, null);
    }

    @Test
    void adminAssignmentReopensRejectedTicketAndTracksReview() {
        User admin = buildUser(60L, "admin-reopen@example.com", "Admin Reopen");
        User reporter = buildUser(61L, "reporter-reopen@example.com", "Reporter Reopen");
        User staff = buildUser(62L, "staff-reopen@example.com", "Staff Reopen");
        UserRole membership = buildMembership(admin, RoleCode.ADMIN);
        Ticket ticket = buildTicket(171L, reporter);
        ticket.setStatus(TicketStatus.REJECTED);
        ticket.setRejectionReason("Insufficient evidence");
        ticket.setRejectedAt(LocalDateTime.now().minusHours(1));
        ticket.setReconsiderationNote("The problem still exists.");
        ticket.setReconsiderationRequestedAt(LocalDateTime.now().minusMinutes(30));

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketRepository.findById(171L)).thenReturn(Optional.of(ticket));
        when(ticketAssignmentRepository.findActiveByTicketId(171L)).thenReturn(Optional.empty());
        when(userRepository.findById(62L)).thenReturn(Optional.of(staff));
        when(userRoleRepository.findActiveByUserId(62L))
                .thenReturn(Optional.of(buildMembership(staff, RoleCode.STAFF)));
        when(ticketRepository.save(ticket)).thenReturn(ticket);
        when(ticketRepository.findDetailedById(171L)).thenReturn(Optional.of(ticket));
        when(ticketAssignmentRepository.findByTicketIdOrderByAssignedAtDesc(171L)).thenReturn(List.of());

        TicketDetailResponse response =
                ticketService.updateAssignment(171L, new UpdateTicketAssignmentRequest(62L, "Check again"));

        assertThat(response.status()).isEqualTo(TicketStatus.OPEN);
        assertThat(response.assignedStaffUserId()).isEqualTo(62L);
        assertThat(response.adminReviewCount()).isEqualTo(1);
        assertThat(response.reconsiderationReviewedAt()).isNotNull();
        verify(ticketCommentService)
                .createSystemStatusNote(
                        ticket,
                        "Rejected ticket reopened for reconsideration and assigned to Staff Reopen",
                        admin);
        verify(notificationService).notifyTicketAssigned(ticket, admin, null);
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
        TicketCategory category = TicketCategory.builder().id(12L).code("IT").name("IT").isActive(true).build();
        Location location = Location.builder().id(30L).name("Building A").build();
        Ticket ticket =
                Ticket.builder()
                        .id(id)
                        .ticketNumber("TCK-TEST-" + id)
                        .reporterUser(reporter)
                        .location(location)
                        .ticketCategory(category)
                        .title("Issue")
                        .description("Desc")
                        .priority(TicketPriority.MEDIUM)
                        .status(TicketStatus.OPEN)
                        .build();
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        return ticket;
    }
}
