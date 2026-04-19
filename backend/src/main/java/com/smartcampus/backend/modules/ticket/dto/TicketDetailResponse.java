package com.smartcampus.backend.modules.ticket.dto;

// Imports the ticket priority enum used to represent the urgency level of the ticket
import com.smartcampus.backend.common.enums.TicketPriority;

// Imports the ticket status enum used to represent the current workflow state of the ticket
import com.smartcampus.backend.common.enums.TicketStatus;

// Imports LocalDateTime to store date and time values for ticket lifecycle events
import java.time.LocalDateTime;

// Imports List because assignment history contains multiple assignment records
import java.util.List;

// This is a response DTO used to send full detailed ticket information
// from the backend to the frontend
public record TicketDetailResponse(

        // Unique ID of the ticket
        Long id,

        // Human-readable ticket number shown in the UI
        // Example: TCK-2026-001
        String ticketNumber,

        // ID of the user who reported/created the ticket
        Long reporterUserId,

        // Email of the user who reported the ticket
        String reporterEmail,

        // Display name of the user who reported the ticket
        String reporterDisplayName,

        // ID of the staff member currently assigned to the ticket
        Long assignedStaffUserId,

        // Display name of the assigned staff member
        String assignedStaffDisplayName,

        // ID of the related resource if the ticket is linked to a resource
        Long resourceId,

        // Code of the related resource
        String resourceCode,

        // Name of the related resource
        String resourceName,

        // Category name of the related resource
        String resourceCategoryName,

        // ID of the related location if the ticket is linked to a location
        Long locationId,

        // Name of the location
        String locationName,

        // Building name of the location
        String locationBuilding,

        // Floor of the location
        String locationFloor,

        // Room identifier of the location
        String locationRoomIdentifier,

        // Additional description of the location
        String locationDescription,

        // ID of the ticket category
        Long ticketCategoryId,

        // Code of the ticket category
        String ticketCategoryCode,

        // Name of the ticket category
        String ticketCategoryName,

        // Title of the ticket
        String title,

        // Main description of the issue
        String description,

        // Priority of the ticket such as LOW, MEDIUM, HIGH
        TicketPriority priority,

        // Current status of the ticket such as OPEN, IN_PROGRESS, RESOLVED, CLOSED
        TicketStatus status,

        // Preferred contact person's name
        String preferredContactName,

        // Preferred contact email
        String preferredContactEmail,

        // Preferred contact phone number
        String preferredContactPhone,

        // Summary of how the issue was resolved
        String resolutionSummary,

        // Reason given if the ticket was rejected
        String rejectionReason,

        // Note provided when reconsideration was requested
        String reconsiderationNote,

        // Date and time when staff first responded to the ticket
        LocalDateTime firstRespondedAt,

        // Date and time when the ticket was resolved
        LocalDateTime resolvedAt,

        // Date and time when the ticket was rejected
        LocalDateTime rejectedAt,

        // Date and time when the ticket was closed
        LocalDateTime closedAt,

        // Date and time when reconsideration was requested
        LocalDateTime reconsiderationRequestedAt,

        // Date and time when reconsideration was reviewed
        LocalDateTime reconsiderationReviewedAt,

        // Date and time when the ticket was created
        LocalDateTime createdAt,

        // Date and time when the ticket was last updated
        LocalDateTime updatedAt,

        // Number of times reconsideration was requested for this ticket
        Integer reconsiderationRequestCount,

        // Number of staff reviews made for this ticket
        Integer staffReviewCount,

        // Number of admin reviews made for this ticket
        Integer adminReviewCount,

        // Full assignment history of the ticket
        // This allows the frontend to show past and current assignment records
        List<TicketAssignmentResponse> assignmentHistory) {}