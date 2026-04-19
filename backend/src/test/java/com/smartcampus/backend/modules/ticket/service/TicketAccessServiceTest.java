package com.smartcampus.backend.modules.ticket.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.modules.auth.service.CurrentUserService;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
class TicketAccessServiceTest {

    @Mock private CurrentUserService currentUserService;

    private TicketAccessService ticketAccessService;

    @BeforeEach
    void setUp() {
        ticketAccessService = new TicketAccessService(currentUserService);
    }

    @Test
    void studentReporterCanManageAttachments() {
        User student = buildUser(1L, "student@example.com");
        UserRole membership = buildMembership(student, RoleCode.STUDENT);
        Ticket ticket = Ticket.builder().id(100L).ticketNumber("TCK-100").reporterUser(student).build();

        assertThatCode(() -> ticketAccessService.ensureCanManageAttachments(membership, ticket))
                .doesNotThrowAnyException();
    }

    @Test
    void adminCannotManageAttachments() {
        User admin = buildUser(1L, "admin@example.com");
        User student = buildUser(2L, "student@example.com");
        UserRole membership = buildMembership(admin, RoleCode.ADMIN);
        Ticket ticket = Ticket.builder().id(100L).ticketNumber("TCK-100").reporterUser(student).build();

        assertThatThrownBy(() -> ticketAccessService.ensureCanManageAttachments(membership, ticket))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("student who raised the ticket");
    }

    @Test
    void staffReporterStillCannotManageAttachments() {
        User staff = buildUser(3L, "staff@example.com");
        UserRole membership = buildMembership(staff, RoleCode.STAFF);
        Ticket ticket = Ticket.builder().id(100L).ticketNumber("TCK-100").reporterUser(staff).build();

        assertThatThrownBy(() -> ticketAccessService.ensureCanManageAttachments(membership, ticket))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("student who raised the ticket");
    }

    private User buildUser(Long id, String email) {
        return User.builder().id(id).email(email).displayName(email).status(UserStatus.ACTIVE).build();
    }

    private UserRole buildMembership(User user, RoleCode roleCode) {
        return UserRole.builder()
                .user(user)
                .role(Role.builder().id(1L).code(roleCode).name(roleCode.name()).build())
                .isActive(true)
                .build();
    }
}
