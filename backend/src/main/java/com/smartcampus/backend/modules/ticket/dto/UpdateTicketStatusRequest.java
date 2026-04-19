package com.smartcampus.backend.modules.ticket.dto;

// Imports the TicketStatus enum used to represent the target status
// that the ticket should be changed to
import com.smartcampus.backend.common.enums.TicketStatus;

// Imports the @NotNull validation annotation
// This ensures the status field must be provided in the request
import jakarta.validation.constraints.NotNull;

// This is a request DTO used when updating the status of an existing ticket
public record UpdateTicketStatusRequest(

        // The new target status for the ticket
        //
        // @NotNull ensures that the client must provide a status value
        // because the system cannot perform a status update without
        // knowing the target workflow state
        @NotNull(message = "Target status is required") TicketStatus status,

        // Optional summary explaining how the issue was resolved
        //
        // This is mainly useful when the ticket is moved to a resolved state
        String resolutionSummary,

        // Optional reason explaining why the ticket was rejected
        //
        // This is mainly useful when the ticket is moved to a rejected state
        String rejectionReason) {}