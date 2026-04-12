package com.smartcampus.backend.modules.ticket.controller;

import com.smartcampus.backend.modules.ticket.dto.TicketAssignmentCreateDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketAssignmentResponseDTO;
import com.smartcampus.backend.modules.ticket.service.TicketAssignmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tickets/{ticketId}/assignments")
public class TicketAssignmentController {

    private final TicketAssignmentService ticketAssignmentService;

    public TicketAssignmentController(TicketAssignmentService ticketAssignmentService) {
        this.ticketAssignmentService = ticketAssignmentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketAssignmentResponseDTO addAssignment(
            @PathVariable Long ticketId,
            @Valid @RequestBody TicketAssignmentCreateDTO assignmentDTO
    ) {
        return ticketAssignmentService.addAssignment(ticketId, assignmentDTO);
    }

    @GetMapping
    public List<TicketAssignmentResponseDTO> getAssignmentsByTicket(@PathVariable Long ticketId) {
        return ticketAssignmentService.getAssignmentsByTicket(ticketId);
    }

    @DeleteMapping("/{assignmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAssignment(@PathVariable Long ticketId, @PathVariable Long assignmentId) {
        ticketAssignmentService.deleteAssignment(ticketId, assignmentId);
    }
}
