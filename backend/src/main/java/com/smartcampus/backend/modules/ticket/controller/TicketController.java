package com.smartcampus.backend.modules.ticket.controller;

// Enum used for filtering tickets by priority in the GET list endpoint
import com.smartcampus.backend.common.enums.TicketPriority;

// Enum used for filtering tickets by status in the GET list endpoint
import com.smartcampus.backend.common.enums.TicketStatus;

// Request DTO used when creating a new ticket
import com.smartcampus.backend.modules.ticket.dto.CreateTicketRequest;

// Request DTO used when requesting reconsideration for a ticket
import com.smartcampus.backend.modules.ticket.dto.RequestTicketReconsiderationRequest;

// Response DTO used when returning full detailed information of a single ticket
import com.smartcampus.backend.modules.ticket.dto.TicketDetailResponse;

// Response DTO used when returning lighter ticket data in list view
import com.smartcampus.backend.modules.ticket.dto.TicketSummaryResponse;

// Request DTO used when updating ticket assignment
import com.smartcampus.backend.modules.ticket.dto.UpdateTicketAssignmentRequest;

// Request DTO used when fully updating a ticket
import com.smartcampus.backend.modules.ticket.dto.UpdateTicketRequest;

// Request DTO used when updating only the ticket status
import com.smartcampus.backend.modules.ticket.dto.UpdateTicketStatusRequest;

// Service layer that contains the business logic for ticket operations
import com.smartcampus.backend.modules.ticket.service.TicketService;

// Used to trigger validation annotations inside request DTOs
import jakarta.validation.Valid;

import java.util.List;

// Lombok annotation that automatically generates constructor injection for final fields
import lombok.RequiredArgsConstructor;

// Used for returning response status codes such as 201 Created and 204 No Content
import org.springframework.http.HttpStatus;

// Used for method-level role-based authorization
import org.springframework.security.access.prepost.PreAuthorize;

// Spring MVC annotations for REST endpoint mappings
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController // Marks this class as a REST controller and returns JSON responses
@RequestMapping("/api/v1/tickets") // Base URL for all ticket-related APIs
@RequiredArgsConstructor // Generates constructor for final fields for dependency injection
public class TicketController {

    // Service dependency used to handle all ticket-related business logic
    private final TicketService ticketService;

    // GET API: /api/v1/tickets
    // Purpose: Retrieve all tickets with optional filters
    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')") // Allows students, staff, and admins
    public List<TicketSummaryResponse> getTickets(
            @RequestParam(required = false) TicketStatus status, // optional filter by ticket status
            @RequestParam(required = false) TicketPriority priority, // optional filter by ticket priority
            @RequestParam(required = false) Long ticketCategoryId, // optional filter by category
            @RequestParam(required = false) String search) { // optional search keyword
        // This endpoint returns a filtered or complete ticket list
        // Request parameters are optional, so users can filter by one, many, or none
        return ticketService.getTickets(status, priority, ticketCategoryId, search);
    }

    // GET API: /api/v1/tickets/{id}
    // Purpose: Retrieve one ticket by its unique ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')") // Allows students, staff, and admins
    public TicketDetailResponse getTicketById(@PathVariable Long id) {
        // id is used because it uniquely identifies the ticket to retrieve
        return ticketService.getTicketById(id);
    }

    // POST API: /api/v1/tickets
    // Purpose: Create a new ticket
    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')") // Allows students, staff, and admins
    @ResponseStatus(HttpStatus.CREATED) // Returns HTTP 201 when ticket is successfully created
    public TicketDetailResponse createTicket(@Valid @RequestBody CreateTicketRequest request) {
        // @RequestBody converts incoming JSON into CreateTicketRequest
        // @Valid applies validation rules defined inside the DTO
        return ticketService.create(request);
    }

    // PUT API: /api/v1/tickets/{id}
    // Purpose: Update the main editable details of an existing ticket
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')") // Allows students, staff, and admins
    public TicketDetailResponse updateTicket(
            @PathVariable Long id, @Valid @RequestBody UpdateTicketRequest request) {
        // Update is done using id because id uniquely identifies which ticket should be edited
        //
        // PUT was used here instead of PATCH because this endpoint represents
        // a broader full update of the ticket's editable details using a dedicated update request object
        //
        // In REST, PUT is generally used when updating/replacing the main state
        // of a resource in a more complete way
        //
        // PATCH is more suitable when only one small part of the ticket is changed,
        // such as only status or only assignment
        return ticketService.updateTicket(id, request);
    }

    // DELETE API: /api/v1/tickets/{id}
    // Purpose: Delete a specific ticket
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')") // Allows students, staff, and admins
    @ResponseStatus(HttpStatus.NO_CONTENT) // Returns HTTP 204 when delete succeeds
    public void deleteTicket(@PathVariable Long id) {
        // Delete is done using id because id uniquely identifies the ticket to remove
        ticketService.deleteTicket(id);
    }

    // PATCH API: /api/v1/tickets/{id}/assignment
    // Purpose: Update only the assignment-related part of a ticket
    @PatchMapping("/{id}/assignment")
    @PreAuthorize("hasRole('ADMIN')") // Only ADMIN can change ticket assignment
    public TicketDetailResponse updateAssignment(
            @PathVariable Long id, @Valid @RequestBody UpdateTicketAssignmentRequest request) {
        // Edit is done using id because id uniquely identifies which ticket is being updated
        //
        // PATCH was used because this endpoint updates only one part of the ticket:
        // the assignment information
        //
        // It does not replace the whole ticket, so PATCH is more accurate than PUT
        return ticketService.updateAssignment(id, request);
    }

    // PATCH API: /api/v1/tickets/{id}/status
    // Purpose: Update only the status of a ticket
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')") // Only STAFF and ADMIN can change ticket status
    public TicketDetailResponse updateStatus(
            @PathVariable Long id, @Valid @RequestBody UpdateTicketStatusRequest request) {
        // Edit is done using id because id uniquely identifies which ticket status should be changed
        //
        // PATCH was used because only one field or one part of the resource is being updated:
        // the ticket status
        //
        // PUT would not be ideal here because the whole ticket is not being replaced
        return ticketService.updateStatus(id, request);
    }

    // PATCH API: /api/v1/tickets/{id}/reconsideration
    // Purpose: Request reconsideration for an existing ticket
    @PatchMapping("/{id}/reconsideration")
    @PreAuthorize("hasRole('STUDENT')") // Only STUDENT can request reconsideration
    public TicketDetailResponse requestReconsideration(
            @PathVariable Long id, @Valid @RequestBody RequestTicketReconsiderationRequest request) {
        // Edit/action is done using id because id uniquely identifies which ticket
        // the reconsideration request applies to
        //
        // PATCH was used because this endpoint changes only a specific aspect/state
        // of the existing ticket rather than replacing the full ticket resource
        return ticketService.requestReconsideration(id, request);
    }
}
