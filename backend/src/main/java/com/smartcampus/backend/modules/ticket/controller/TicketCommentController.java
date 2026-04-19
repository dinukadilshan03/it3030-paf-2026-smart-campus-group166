package com.smartcampus.backend.modules.ticket.controller;

// Request DTO used when creating a new comment for a ticket
import com.smartcampus.backend.modules.ticket.dto.CreateTicketCommentRequest;

// Response DTO returned to the frontend when comment data is sent back
import com.smartcampus.backend.modules.ticket.dto.TicketCommentResponse;

// Request DTO used when partially updating an existing comment
import com.smartcampus.backend.modules.ticket.dto.UpdateTicketCommentRequest;

// Service layer that contains comment-related business logic
import com.smartcampus.backend.modules.ticket.service.TicketCommentService;

// Service layer used to fetch and validate the parent ticket
import com.smartcampus.backend.modules.ticket.service.TicketService;

// Used to trigger validation annotations inside request DTOs
import jakarta.validation.Valid;

import java.util.List;

// Lombok annotation to automatically generate constructor injection for final fields
import lombok.RequiredArgsConstructor;

// Spring MVC annotation for DELETE endpoint mapping
import org.springframework.web.bind.annotation.DeleteMapping;

// Used for setting response status codes like 201 Created and 204 No Content
import org.springframework.http.HttpStatus;

// Used for role-based authorization on methods
import org.springframework.security.access.prepost.PreAuthorize;

// Spring MVC annotations for REST endpoint mappings
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController // Marks this class as a REST controller and returns JSON responses
@RequestMapping("/api/v1/tickets/{ticketId}/comments") // Base URL for comment APIs under a specific ticket
@RequiredArgsConstructor // Generates constructor for final fields for dependency injection
public class TicketCommentController {

    // Service used to fetch and validate the parent ticket
    private final TicketService ticketService;

    // Service used to handle comment-related operations
    private final TicketCommentService ticketCommentService;

    // GET API: /api/v1/tickets/{ticketId}/comments
    // Purpose: Retrieve all comments belonging to a specific ticket
    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')") // Allows students, staff, and admins
    public List<TicketCommentResponse> getComments(@PathVariable Long ticketId) {
        // ticketId is used because comments belong to a specific ticket
        // detailed ticket entity is enough here because this is a read-only operation
        return ticketCommentService.getComments(ticketService.getDetailedTicketEntity(ticketId));
    }

    // POST API: /api/v1/tickets/{ticketId}/comments
    // Purpose: Add a new comment to a specific ticket
    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')") // Allows students, staff, and admins
    @ResponseStatus(HttpStatus.CREATED) // Returns HTTP 201 when comment is successfully created
    public TicketCommentResponse addComment(
            @PathVariable Long ticketId,
            @Valid @RequestBody CreateTicketCommentRequest request) {
        // ticketId is used to identify which ticket the comment should be added to
        // managed ticket entity is used because this operation modifies data
        // request body contains the new comment content
        return ticketCommentService.addComment(ticketService.getManagedTicketEntity(ticketId), request);
    }

    // PATCH API: /api/v1/tickets/{ticketId}/comments/{commentId}
    // Purpose: Partially update an existing comment
    @PatchMapping("/{commentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')") // Allows students, staff, and admins
    public TicketCommentResponse updateComment(
            @PathVariable Long ticketId,
            @PathVariable Long commentId,
            @Valid @RequestBody UpdateTicketCommentRequest request) {
        // Update is done using commentId because commentId uniquely identifies
        // the exact comment that should be edited
        //
        // ticketId is also passed because the comment must belong to the correct parent ticket
        //
        // PATCH was used instead of PUT because comment editing is usually a partial update,
        // for example changing only the comment text or a small set of fields
        // without replacing the whole comment resource
        //
        // PUT would be more appropriate if the full comment resource had to be replaced
        return ticketCommentService.updateComment(
                ticketService.getManagedTicketEntity(ticketId), commentId, request);
    }

    // DELETE API: /api/v1/tickets/{ticketId}/comments/{commentId}
    // Purpose: Delete a specific comment from a ticket
    @DeleteMapping("/{commentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')") // Allows students, staff, and admins
    @ResponseStatus(HttpStatus.NO_CONTENT) // Returns HTTP 204 when deletion succeeds
    public void deleteComment(@PathVariable Long ticketId, @PathVariable Long commentId) {
        // Delete is done using commentId because commentId uniquely identifies
        // the exact comment record to remove
        //
        // ticketId is also provided to ensure the comment belongs to the correct ticket
        //
        // managed ticket entity is used because deleting a comment changes data
        ticketCommentService.deleteComment(ticketService.getManagedTicketEntity(ticketId), commentId);
    }
}