package com.smartcampus.backend.modules.ticket.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.CommentType;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.modules.ticket.dto.CreateTicketCommentRequest;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketCategory;
import com.smartcampus.backend.modules.ticket.entity.TicketComment;
import com.smartcampus.backend.modules.ticket.mapper.TicketMapper;
import com.smartcampus.backend.modules.ticket.repository.TicketCommentRepository;
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
class TicketCommentServiceTest {

    @Mock private TicketCommentRepository ticketCommentRepository;
    @Mock private TicketAccessService ticketAccessService;

    private TicketCommentService ticketCommentService;

    @BeforeEach
    void setUp() {
        ticketCommentService =
                new TicketCommentService(ticketCommentRepository, ticketAccessService, new TicketMapper());
    }

    @Test
    void reporterCannotCreateInternalNote() {
        User reporter = buildUser(1L, "reporter@example.com", "Reporter");
        UserRole membership = buildMembership(reporter, RoleCode.STUDENT);
        Ticket ticket = buildTicket(100L, reporter);

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        doThrow(new AccessDeniedException("forbidden"))
                .when(ticketAccessService)
                .ensureCanAddInternalNote(membership, ticket);

        assertThatThrownBy(
                        () ->
                                ticketCommentService.addComment(
                                        ticket,
                                        new CreateTicketCommentRequest(
                                                "Internal note", CommentType.INTERNAL_NOTE, null)))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void commentListHidesInternalNotesFromReporter() {
        User reporter = buildUser(2L, "reporter2@example.com", "Reporter 2");
        UserRole membership = buildMembership(reporter, RoleCode.STUDENT);
        Ticket ticket = buildTicket(101L, reporter);
        TicketComment publicReply =
                TicketComment.builder()
                        .id(1L)
                        .ticket(ticket)
                        .authorUser(reporter)
                        .body("Public")
                        .commentType(CommentType.PUBLIC_REPLY)
                        .build();
        publicReply.setCreatedAt(LocalDateTime.now());
        publicReply.setUpdatedAt(LocalDateTime.now());
        TicketComment internalNote =
                TicketComment.builder()
                        .id(2L)
                        .ticket(ticket)
                        .authorUser(reporter)
                        .body("Internal")
                        .commentType(CommentType.INTERNAL_NOTE)
                        .build();
        internalNote.setCreatedAt(LocalDateTime.now());
        internalNote.setUpdatedAt(LocalDateTime.now());

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketCommentRepository.findByTicketIdOrderByCreatedAtAsc(101L))
                .thenReturn(List.of(publicReply, internalNote));

        var responses = ticketCommentService.getComments(ticket);

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().commentType()).isEqualTo(CommentType.PUBLIC_REPLY);
    }

    @Test
    void statusNotesCannotBeCreatedManually() {
        User admin = buildUser(3L, "admin@example.com", "Admin");
        UserRole membership = buildMembership(admin, RoleCode.ADMIN);
        Ticket ticket = buildTicket(102L, buildUser(4L, "rep@example.com", "Rep"));

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);

        assertThatThrownBy(
                        () ->
                                ticketCommentService.addComment(
                                        ticket,
                                        new CreateTicketCommentRequest(
                                                "Status", CommentType.STATUS_NOTE, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("system-generated");
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
        Ticket ticket =
                Ticket.builder()
                        .id(id)
                        .ticketNumber("TCK-" + id)
                        .reporterUser(reporter)
                        .ticketCategory(TicketCategory.builder().id(1L).code("IT").name("IT").build())
                        .title("Issue")
                        .description("Desc")
                        .build();
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        return ticket;
    }
}
