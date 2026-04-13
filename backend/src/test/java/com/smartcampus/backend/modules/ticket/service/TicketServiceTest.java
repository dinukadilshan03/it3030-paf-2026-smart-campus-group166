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
import com.smartcampus.backend.modules.resource.entity.Location;
import com.smartcampus.backend.modules.resource.entity.Resource;
import com.smartcampus.backend.modules.resource.service.LocationService;
import com.smartcampus.backend.modules.resource.service.ResourceService;
import com.smartcampus.backend.modules.ticket.dto.CreateTicketRequest;
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
    @Mock private ResourceService resourceService;
    @Mock private LocationService locationService;
    @Mock private TicketAccessService ticketAccessService;
    @Mock private UserRepository userRepository;
    @Mock private UserRoleRepository userRoleRepository;

    private TicketService ticketService;

    @BeforeEach
    void setUp() {
        ticketService =
                new TicketService(
                        ticketRepository,
                        ticketAssignmentRepository,
                        ticketCategoryService,
                        ticketCommentService,
                        resourceService,
                        locationService,
                        ticketAccessService,
                        userRepository,
                        userRoleRepository,
                        new TicketMapper());
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
                                30L,
                                null,
                                10L,
                                "Broken PC",
                                "Will not boot",
                                null,
                                null,
                                null,
                                null));

        assertThat(response.priority()).isEqualTo(TicketPriority.MEDIUM);
        assertThat(response.status()).isEqualTo(TicketStatus.OPEN);
        assertThat(response.locationId()).isEqualTo(20L);
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
        User admin = buildUser(8L, "admin2@example.com", "Admin 2");
        UserRole membership = buildMembership(admin, RoleCode.ADMIN);
        Ticket ticket = buildTicket(102L, buildUser(9L, "reporter3@example.com", "Reporter 3"));
        ticket.setStatus(TicketStatus.OPEN);

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
        verify(ticketCommentService).createSystemStatusNote(any(Ticket.class), any(String.class), any(User.class));
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
