package com.smartcampus.backend.modules.ticket.dto;

// Imports the ticket priority enum used to represent urgency
import com.smartcampus.backend.common.enums.TicketPriority;

// Imports the ticket status enum used to represent the current workflow state
import com.smartcampus.backend.common.enums.TicketStatus;

// Imports LocalDateTime to store ticket timestamps
import java.time.LocalDateTime;

// This is a response DTO used to send a lighter/summary version
// of ticket data from the backend to the frontend
public record TicketSummaryResponse(

        // Unique ID of the ticket
        Long id,

        // Human-readable ticket number shown in the UI
        String ticketNumber,

        // ID of the user who created/reported the ticket
        Long reporterUserId,

        // Display name of the ticket reporter
        String reporterDisplayName,

        // ID of the currently assigned staff member
        Long assignedStaffUserId,

        // Display name of the assigned staff member
        String assignedStaffDisplayName,

        // ID of the related resource, if the ticket is linked to a resource
        Long resourceId,

        // Name of the related resource
        String resourceName,

        // ID of the related location, if the ticket is linked to a location
        Long locationId,

        // Name of the related location
        String locationName,

        // ID of the ticket category
        Long ticketCategoryId,

        // Short code of the ticket category
        String ticketCategoryCode,

        // Name of the ticket category
        String ticketCategoryName,

        // Title of the ticket
        String title,

        // Priority of the ticket such as LOW, MEDIUM, HIGH
        TicketPriority priority,

        // Current status of the ticket such as OPEN, IN_PROGRESS, RESOLVED, CLOSED
        TicketStatus status,

        // Date and time when the ticket was created
        LocalDateTime createdAt,

        // Date and time when the ticket was last updated
        LocalDateTime updatedAt,

        // Date and time when staff first responded to the ticket
        LocalDateTime firstRespondedAt,

        // Date and time when the ticket was resolved
        LocalDateTime resolvedAt,

        // Number of times reconsideration was requested for this ticket
        Integer reconsiderationRequestCount,

        // Number of staff reviews related to this ticket
        Integer staffReviewCount,

        // Number of admin reviews related to this ticket
        Integer adminReviewCount) {}