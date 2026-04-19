package com.smartcampus.backend.modules.ticket.mapper;

// User entity is used here to resolve a display name for API responses
import com.smartcampus.backend.common.entity.User;

// Response DTOs that this mapper creates from entity objects
import com.smartcampus.backend.modules.ticket.dto.TicketAssignmentResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketCategoryDetailResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketCategorySummaryResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketCommentResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketDetailResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketSummaryResponse;

// Entity classes that are converted into DTOs
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketAssignment;
import com.smartcampus.backend.modules.ticket.entity.TicketAttachment;
import com.smartcampus.backend.modules.ticket.entity.TicketCategory;
import com.smartcampus.backend.modules.ticket.entity.TicketComment;

import java.util.List;

// Marks this class as a Spring-managed component so it can be injected where needed
import org.springframework.stereotype.Component;

@Component // Registers this mapper as a Spring bean
public class TicketMapper {

    // Converts TicketCategory entity into a summary DTO
    // Used when returning a lighter list view of categories
    public TicketCategorySummaryResponse toCategorySummary(TicketCategory category) {
        return new TicketCategorySummaryResponse(
                category.getId(),          // Category ID
                category.getCode(),        // Category code
                category.getName(),        // Category name
                category.getDescription(), // Category description
                category.getIsActive());   // Whether category is active
    }

    // Converts TicketCategory entity into a detailed DTO
    // Used when returning full category details including audit timestamps
    public TicketCategoryDetailResponse toCategoryDetail(TicketCategory category) {
        return new TicketCategoryDetailResponse(
                category.getId(),          // Category ID
                category.getCode(),        // Category code
                category.getName(),        // Category name
                category.getDescription(), // Category description
                category.getIsActive(),    // Active/inactive status
                category.getCreatedAt(),   // Created timestamp from AuditableEntity
                category.getUpdatedAt());  // Last updated timestamp from AuditableEntity
    }

    // Converts Ticket entity into a summary DTO
    // Used for ticket list endpoints where only overview data is needed
    public TicketSummaryResponse toSummary(Ticket ticket) {
        return new TicketSummaryResponse(
                ticket.getId(), // Ticket ID
                ticket.getTicketNumber(), // User-friendly ticket number

                ticket.getReporterUser().getId(), // Reporter user ID
                resolveDisplayName(ticket.getReporterUser()), // Reporter display name

                // Assigned staff ID, null if not assigned
                ticket.getAssignedStaffUser() == null ? null : ticket.getAssignedStaffUser().getId(),

                // Assigned staff display name, null if not assigned
                ticket.getAssignedStaffUser() == null
                        ? null
                        : resolveDisplayName(ticket.getAssignedStaffUser()),

                // Resource ID, null if ticket is not linked to a resource
                ticket.getResource() == null ? null : ticket.getResource().getId(),

                // Resource name, null if no resource is linked
                ticket.getResource() == null ? null : ticket.getResource().getName(),

                // Location ID, null if ticket is not linked to a location
                ticket.getLocation() == null ? null : ticket.getLocation().getId(),

                // Location name, null if no location is linked
                ticket.getLocation() == null ? null : ticket.getLocation().getName(),

                // Category details
                ticket.getTicketCategory().getId(),
                ticket.getTicketCategory().getCode(),
                ticket.getTicketCategory().getName(),

                // Core ticket fields
                ticket.getTitle(),
                ticket.getPriority(),
                ticket.getStatus(),

                // Audit / progress timestamps
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),
                ticket.getFirstRespondedAt(),
                ticket.getResolvedAt(),

                // Review / reconsideration counters
                ticket.getReconsiderationRequestCount(),
                ticket.getStaffReviewCount(),
                ticket.getAdminReviewCount());
    }

    // Converts Ticket entity into a detailed DTO
    // Used when the frontend needs full ticket information
    // assignmentHistory is passed separately because it may come from another query/service call
    public TicketDetailResponse toDetail(Ticket ticket, List<TicketAssignmentResponse> assignmentHistory) {
        return new TicketDetailResponse(
                ticket.getId(), // Ticket ID
                ticket.getTicketNumber(), // Human-readable ticket number

                // Reporter details
                ticket.getReporterUser().getId(),
                ticket.getReporterUser().getEmail(),
                resolveDisplayName(ticket.getReporterUser()),

                // Assigned staff details, null if not assigned
                ticket.getAssignedStaffUser() == null ? null : ticket.getAssignedStaffUser().getId(),
                ticket.getAssignedStaffUser() == null
                        ? null
                        : resolveDisplayName(ticket.getAssignedStaffUser()),

                // Resource details, null-safe because resource is optional
                ticket.getResource() == null ? null : ticket.getResource().getId(),
                ticket.getResource() == null ? null : ticket.getResource().getResourceCode(),
                ticket.getResource() == null ? null : ticket.getResource().getName(),

                // Resource category name, also null-safe
                ticket.getResource() == null || ticket.getResource().getResourceCategory() == null
                        ? null
                        : ticket.getResource().getResourceCategory().getName(),

                // Location details, null-safe because location is optional
                ticket.getLocation() == null ? null : ticket.getLocation().getId(),
                ticket.getLocation() == null ? null : ticket.getLocation().getName(),
                ticket.getLocation() == null ? null : ticket.getLocation().getBuilding(),
                ticket.getLocation() == null ? null : ticket.getLocation().getFloor(),
                ticket.getLocation() == null ? null : ticket.getLocation().getRoomIdentifier(),
                ticket.getLocation() == null ? null : ticket.getLocation().getDescription(),

                // Category details
                ticket.getTicketCategory().getId(),
                ticket.getTicketCategory().getCode(),
                ticket.getTicketCategory().getName(),

                // Main ticket content
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getPriority(),
                ticket.getStatus(),

                // Preferred contact details
                ticket.getPreferredContactName(),
                ticket.getPreferredContactEmail(),
                ticket.getPreferredContactPhone(),

                // Resolution / rejection / reconsideration fields
                ticket.getResolutionSummary(),
                ticket.getRejectionReason(),
                ticket.getReconsiderationNote(),

                // Workflow timestamps
                ticket.getFirstRespondedAt(),
                ticket.getResolvedAt(),
                ticket.getRejectedAt(),
                ticket.getClosedAt(),
                ticket.getReconsiderationRequestedAt(),
                ticket.getReconsiderationReviewedAt(),

                // Audit timestamps
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),

                // Counters
                ticket.getReconsiderationRequestCount(),
                ticket.getStaffReviewCount(),
                ticket.getAdminReviewCount(),

                // Assignment history passed into the mapper
                assignmentHistory);
    }

    // Converts TicketAssignment entity into assignment response DTO
    public TicketAssignmentResponse toAssignmentResponse(TicketAssignment assignment) {
        return new TicketAssignmentResponse(
                assignment.getId(), // Assignment record ID
                assignment.getAssignedToUser().getId(), // Assigned user ID
                resolveDisplayName(assignment.getAssignedToUser()), // Assigned user display name
                assignment.getAssignedByUser().getId(), // Assigner user ID
                resolveDisplayName(assignment.getAssignedByUser()), // Assigner display name
                assignment.getAssignmentNote(), // Optional assignment note
                assignment.getIsActive(), // Whether assignment is currently active
                assignment.getAssignedAt(), // Assignment start time
                assignment.getUnassignedAt()); // Assignment end time, if any
    }

    // Converts TicketComment entity into comment response DTO
    public TicketCommentResponse toCommentResponse(TicketComment comment) {
        return new TicketCommentResponse(
                comment.getId(), // Comment ID
                comment.getAuthorUser().getId(), // Author user ID
                resolveDisplayName(comment.getAuthorUser()), // Author display name
                comment.getBody(), // Comment text
                comment.getCommentType(), // Comment type enum

                // Parent comment ID for replies, null if top-level comment
                comment.getParentComment() == null ? null : comment.getParentComment().getId(),

                comment.getIsEdited(), // Whether comment was edited
                comment.getEditedAt(), // Edited timestamp
                comment.getCreatedAt(), // Created timestamp from AuditableEntity
                comment.getUpdatedAt()); // Updated timestamp from AuditableEntity
    }

    // Converts TicketAttachment entity into attachment response DTO
    public TicketAttachmentResponse toAttachmentResponse(TicketAttachment attachment) {
        return new TicketAttachmentResponse(
                attachment.getId(), // Attachment ID
                attachment.getUploadedByUser().getId(), // Uploader user ID
                resolveDisplayName(attachment.getUploadedByUser()), // Uploader display name
                attachment.getTitle(), // Attachment title
                attachment.getFileName(), // Original file name
                attachment.getStorageBucket(), // Storage bucket name
                attachment.getStoragePath(), // Storage path/key
                attachment.getMimeType(), // MIME type
                attachment.getFileSize(), // File size in bytes
                attachment.getAttachmentType(), // Logical attachment type
                attachment.getCreatedAt()); // Attachment created time
    }

    // Helper method to decide what display name should be shown in responses
    // If the user has a display name, use it
    // Otherwise fall back to the user's email
    private String resolveDisplayName(User user) {
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName();
        }
        return user.getEmail();
    }
}