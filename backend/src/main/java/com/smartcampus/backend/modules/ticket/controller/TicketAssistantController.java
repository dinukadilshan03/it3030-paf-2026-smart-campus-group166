package com.smartcampus.backend.modules.ticket.controller;

import com.smartcampus.backend.modules.ticket.dto.RefineTicketDescriptionRequest;
import com.smartcampus.backend.modules.ticket.dto.RefineTicketDescriptionResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketAssistantQueryRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketAssistantResponse;
import com.smartcampus.backend.modules.ticket.service.TicketAssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ticket-assistant")
@RequiredArgsConstructor
public class TicketAssistantController {

    private final TicketAssistantService ticketAssistantService;

    @PostMapping("/query")
    @PreAuthorize("hasRole('STUDENT')")
    public TicketAssistantResponse query(@Valid @RequestBody TicketAssistantQueryRequest request) {
        return ticketAssistantService.query(request);
    }

    @PostMapping("/refine-description")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public RefineTicketDescriptionResponse refineDescription(
            @Valid @RequestBody RefineTicketDescriptionRequest request) {
        return ticketAssistantService.refineDescription(request);
    }
}
