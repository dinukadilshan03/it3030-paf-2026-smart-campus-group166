package com.smartcampus.backend.modules.ticket.controller;

// Request and response DTOs used by this controller
import com.smartcampus.backend.modules.ticket.dto.RefineTicketDescriptionRequest;
import com.smartcampus.backend.modules.ticket.dto.RefineTicketDescriptionResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketAssistantQueryRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketAssistantResponse;

// Service layer that contains the business logic
import com.smartcampus.backend.modules.ticket.service.TicketAssistantService;

// Used to trigger validation on request DTOs
import jakarta.validation.Valid;

// Lombok annotation to generate constructor for final fields
import lombok.RequiredArgsConstructor;

// Used for role-based authorization
import org.springframework.security.access.prepost.PreAuthorize;

// Spring MVC annotations for REST APIs
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController // Marks this class as a REST controller and returns responses as JSON
@RequestMapping("/api/v1/ticket-assistant") // Base path for all APIs in this controller
@RequiredArgsConstructor // Automatically injects final fields using constructor injection
public class TicketAssistantController {

    // Service dependency used to handle assistant-related logic
    private final TicketAssistantService ticketAssistantService;

    // POST API: /api/v1/ticket-assistant/query
    // Used by students to send a question/query to the ticket assistant
    @PostMapping("/query")
    @PreAuthorize("hasRole('STUDENT')") // Only STUDENT role can access this endpoint
    public TicketAssistantResponse query(
            @Valid @RequestBody TicketAssistantQueryRequest request // Validates incoming JSON request body
    ) {
        // Delegates the request to the service layer and returns the assistant response
        return ticketAssistantService.query(request);
    }

    // POST API: /api/v1/ticket-assistant/refine-description
    // Used to improve/refine a ticket description before submission
    @PostMapping("/refine-description")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')") // Multiple roles can access
    public RefineTicketDescriptionResponse refineDescription(
            @Valid @RequestBody RefineTicketDescriptionRequest request // Validates incoming JSON request body
    ) {
        // Calls the service layer to refine the description and returns the result
        return ticketAssistantService.refineDescription(request);
    }
}