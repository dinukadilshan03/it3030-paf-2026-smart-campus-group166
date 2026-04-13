package com.smartcampus.backend.modules.ticket.controller;

import com.smartcampus.backend.common.enums.TicketPriority;
import com.smartcampus.backend.common.enums.TicketStatus;
import com.smartcampus.backend.modules.ticket.dto.CreateTicketRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketDetailResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketSummaryResponse;
import com.smartcampus.backend.modules.ticket.dto.UpdateTicketAssignmentRequest;
import com.smartcampus.backend.modules.ticket.dto.UpdateTicketStatusRequest;
import com.smartcampus.backend.modules.ticket.service.TicketService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public List<TicketSummaryResponse> getTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) Long ticketCategoryId,
            @RequestParam(required = false) String search) {
        return ticketService.getTickets(status, priority, ticketCategoryId, search);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public TicketDetailResponse getTicketById(@PathVariable Long id) {
        return ticketService.getTicketById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public TicketDetailResponse createTicket(@Valid @RequestBody CreateTicketRequest request) {
        return ticketService.create(request);
    }

    @PatchMapping("/{id}/assignment")
    @PreAuthorize("hasRole('ADMIN')")
    public TicketDetailResponse updateAssignment(
            @PathVariable Long id, @Valid @RequestBody UpdateTicketAssignmentRequest request) {
        return ticketService.updateAssignment(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public TicketDetailResponse updateStatus(
            @PathVariable Long id, @Valid @RequestBody UpdateTicketStatusRequest request) {
        return ticketService.updateStatus(id, request);
    }
}
