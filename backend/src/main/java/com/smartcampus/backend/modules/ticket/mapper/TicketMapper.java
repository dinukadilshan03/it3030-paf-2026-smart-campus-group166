package com.smartcampus.backend.modules.ticket.mapper;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.modules.ticket.dto.TicketAssignmentResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketCategoryDetailResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketCategorySummaryResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketCommentResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketDetailResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketSummaryResponse;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketAssignment;
import com.smartcampus.backend.modules.ticket.entity.TicketAttachment;
import com.smartcampus.backend.modules.ticket.entity.TicketCategory;
import com.smartcampus.backend.modules.ticket.entity.TicketComment;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class TicketMapper {

    public TicketCategorySummaryResponse toCategorySummary(TicketCategory category) {
        return new TicketCategorySummaryResponse(
                category.getId(),
                category.getCode(),
                category.getName(),
                category.getDescription(),
                category.getIsActive());
    }

    public TicketCategoryDetailResponse toCategoryDetail(TicketCategory category) {
        return new TicketCategoryDetailResponse(
                category.getId(),
                category.getCode(),
                category.getName(),
                category.getDescription(),
                category.getIsActive(),
                category.getCreatedAt(),
                category.getUpdatedAt());
    }

    public TicketSummaryResponse toSummary(Ticket ticket) {
        return new TicketSummaryResponse(
                ticket.getId(),
                ticket.getTicketNumber(),
                ticket.getReporterUser().getId(),
                resolveDisplayName(ticket.getReporterUser()),
                ticket.getAssignedStaffUser() == null ? null : ticket.getAssignedStaffUser().getId(),
                ticket.getAssignedStaffUser() == null
                        ? null
                        : resolveDisplayName(ticket.getAssignedStaffUser()),
                ticket.getResource() == null ? null : ticket.getResource().getId(),
                ticket.getResource() == null ? null : ticket.getResource().getName(),
                ticket.getLocation() == null ? null : ticket.getLocation().getId(),
                ticket.getLocation() == null ? null : ticket.getLocation().getName(),
                ticket.getTicketCategory().getId(),
                ticket.getTicketCategory().getCode(),
                ticket.getTicketCategory().getName(),
                ticket.getTitle(),
                ticket.getPriority(),
                ticket.getStatus(),
                ticket.getCreatedAt(),
                ticket.getFirstRespondedAt(),
                ticket.getResolvedAt());
    }

    public TicketDetailResponse toDetail(Ticket ticket, List<TicketAssignmentResponse> assignmentHistory) {
        return new TicketDetailResponse(
                ticket.getId(),
                ticket.getTicketNumber(),
                ticket.getReporterUser().getId(),
                ticket.getReporterUser().getEmail(),
                resolveDisplayName(ticket.getReporterUser()),
                ticket.getAssignedStaffUser() == null ? null : ticket.getAssignedStaffUser().getId(),
                ticket.getAssignedStaffUser() == null
                        ? null
                        : resolveDisplayName(ticket.getAssignedStaffUser()),
                ticket.getResource() == null ? null : ticket.getResource().getId(),
                ticket.getResource() == null ? null : ticket.getResource().getResourceCode(),
                ticket.getResource() == null ? null : ticket.getResource().getName(),
                ticket.getResource() == null || ticket.getResource().getResourceCategory() == null
                        ? null
                        : ticket.getResource().getResourceCategory().getName(),
                ticket.getLocation() == null ? null : ticket.getLocation().getId(),
                ticket.getLocation() == null ? null : ticket.getLocation().getName(),
                ticket.getLocation() == null ? null : ticket.getLocation().getBuilding(),
                ticket.getLocation() == null ? null : ticket.getLocation().getFloor(),
                ticket.getLocation() == null ? null : ticket.getLocation().getRoomIdentifier(),
                ticket.getLocation() == null ? null : ticket.getLocation().getDescription(),
                ticket.getTicketCategory().getId(),
                ticket.getTicketCategory().getCode(),
                ticket.getTicketCategory().getName(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getPriority(),
                ticket.getStatus(),
                ticket.getPreferredContactName(),
                ticket.getPreferredContactEmail(),
                ticket.getPreferredContactPhone(),
                ticket.getResolutionSummary(),
                ticket.getRejectionReason(),
                ticket.getFirstRespondedAt(),
                ticket.getResolvedAt(),
                ticket.getRejectedAt(),
                ticket.getClosedAt(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),
                assignmentHistory);
    }

    public TicketAssignmentResponse toAssignmentResponse(TicketAssignment assignment) {
        return new TicketAssignmentResponse(
                assignment.getId(),
                assignment.getAssignedToUser().getId(),
                resolveDisplayName(assignment.getAssignedToUser()),
                assignment.getAssignedByUser().getId(),
                resolveDisplayName(assignment.getAssignedByUser()),
                assignment.getAssignmentNote(),
                assignment.getIsActive(),
                assignment.getAssignedAt(),
                assignment.getUnassignedAt());
    }

    public TicketCommentResponse toCommentResponse(TicketComment comment) {
        return new TicketCommentResponse(
                comment.getId(),
                comment.getAuthorUser().getId(),
                resolveDisplayName(comment.getAuthorUser()),
                comment.getBody(),
                comment.getCommentType(),
                comment.getParentComment() == null ? null : comment.getParentComment().getId(),
                comment.getIsEdited(),
                comment.getEditedAt(),
                comment.getCreatedAt(),
                comment.getUpdatedAt());
    }

    public TicketAttachmentResponse toAttachmentResponse(TicketAttachment attachment) {
        return new TicketAttachmentResponse(
                attachment.getId(),
                attachment.getUploadedByUser().getId(),
                resolveDisplayName(attachment.getUploadedByUser()),
                attachment.getTitle(),
                attachment.getFileName(),
                attachment.getStorageBucket(),
                attachment.getStoragePath(),
                attachment.getMimeType(),
                attachment.getFileSize(),
                attachment.getAttachmentType(),
                attachment.getCreatedAt());
    }

    private String resolveDisplayName(User user) {
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName();
        }
        return user.getEmail();
    }
}
