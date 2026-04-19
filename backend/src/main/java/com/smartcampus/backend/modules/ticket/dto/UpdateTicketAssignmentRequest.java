package com.smartcampus.backend.modules.ticket.dto;

// Imports the @NotNull validation annotation
// This ensures the field cannot be null
import jakarta.validation.constraints.NotNull;

// This is a request DTO used when updating the staff assignment of a ticket
public record UpdateTicketAssignmentRequest(

        // ID of the staff user to whom the ticket should be assigned
        //
        // @NotNull ensures that the client must provide a valid staff user ID
        // because assignment cannot happen without selecting a target staff member
        @NotNull(message = "Assigned staff user is required") Long assignedStaffUserId,

        // Optional note added during assignment
        // This can be used to explain why the ticket is being assigned,
        // give instructions, or provide context for the assigned staff member
        String assignmentNote) {}