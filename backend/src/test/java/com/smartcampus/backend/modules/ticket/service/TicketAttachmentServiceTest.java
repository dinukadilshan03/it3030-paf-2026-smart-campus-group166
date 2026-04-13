package com.smartcampus.backend.modules.ticket.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.modules.ticket.dto.CreateTicketAttachmentRequest;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketCategory;
import com.smartcampus.backend.modules.ticket.mapper.TicketMapper;
import com.smartcampus.backend.modules.ticket.repository.TicketAttachmentRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TicketAttachmentServiceTest {

    @Mock private TicketAttachmentRepository ticketAttachmentRepository;
    @Mock private TicketAccessService ticketAccessService;

    private TicketAttachmentService ticketAttachmentService;

    @BeforeEach
    void setUp() {
        ticketAttachmentService =
                new TicketAttachmentService(ticketAttachmentRepository, ticketAccessService, new TicketMapper());
    }

    @Test
    void rejectsMoreThanThreeAttachments() {
        User reporter = User.builder().id(1L).email("reporter@example.com").status(UserStatus.ACTIVE).build();
        UserRole membership =
                UserRole.builder()
                        .user(reporter)
                        .role(Role.builder().id(1L).code(RoleCode.STUDENT).name("STUDENT").build())
                        .isActive(true)
                        .build();
        Ticket ticket =
                Ticket.builder()
                        .id(100L)
                        .ticketNumber("TCK-100")
                        .reporterUser(reporter)
                        .ticketCategory(TicketCategory.builder().id(1L).code("IT").name("IT").build())
                        .title("Issue")
                        .description("Desc")
                        .build();
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketAttachmentRepository.countByTicket_Id(100L)).thenReturn(3L);

        assertThatThrownBy(
                        () ->
                                ticketAttachmentService.addAttachment(
                                        ticket,
                                        new CreateTicketAttachmentRequest(
                                                "a.txt",
                                                "ticket-attachments",
                                                "path/a.txt",
                                                "text/plain",
                                                10L,
                                                "EVIDENCE")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at most 3 attachments");
    }
}
