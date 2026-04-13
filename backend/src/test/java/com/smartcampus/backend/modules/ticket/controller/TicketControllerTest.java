package com.smartcampus.backend.modules.ticket.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.common.enums.TicketPriority;
import com.smartcampus.backend.common.enums.TicketStatus;
import com.smartcampus.backend.modules.ticket.dto.TicketSummaryResponse;
import com.smartcampus.backend.modules.ticket.service.TicketService;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.prepost.PreAuthorize;

@ExtendWith(MockitoExtension.class)
class TicketControllerTest {

    @Mock private TicketService ticketService;

    @InjectMocks private TicketController ticketController;

    @Test
    void assignmentEndpointIsRestrictedToAdmins() throws NoSuchMethodException {
        Method method =
                TicketController.class.getDeclaredMethod(
                        "updateAssignment",
                        Long.class,
                        com.smartcampus.backend.modules.ticket.dto.UpdateTicketAssignmentRequest.class);
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);

        assertThat(annotation).isNotNull();
        assertThat(annotation.value()).isEqualTo("hasRole('ADMIN')");
    }

    @Test
    void returnsTicketsFromService() {
        TicketSummaryResponse summary =
                new TicketSummaryResponse(
                        1L,
                        "TCK-1",
                        2L,
                        "Reporter",
                        3L,
                        "Staff",
                        4L,
                        "Projector",
                        5L,
                        "Hall A",
                        6L,
                        "IT",
                        "IT Support",
                        "Broken projector",
                        TicketPriority.HIGH,
                        TicketStatus.OPEN,
                        LocalDateTime.now());
        when(ticketService.getTickets(TicketStatus.OPEN, TicketPriority.HIGH, 6L, "projector"))
                .thenReturn(List.of(summary));

        var responses = ticketController.getTickets(TicketStatus.OPEN, TicketPriority.HIGH, 6L, "projector");

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().ticketCategoryCode()).isEqualTo("IT");
    }
}
