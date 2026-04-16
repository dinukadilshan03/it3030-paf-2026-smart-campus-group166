package com.smartcampus.backend.modules.ticket.dto;

import com.smartcampus.backend.common.enums.TicketPriority;
import com.smartcampus.backend.common.enums.TicketStatus;
import java.time.LocalDateTime;
import java.util.List;

public record TicketDetailResponse(
        Long id,
        String ticketNumber,
        Long reporterUserId,
        String reporterEmail,
        String reporterDisplayName,
        Long assignedStaffUserId,
        String assignedStaffDisplayName,
        Long resourceId,
        String resourceCode,
        String resourceName,
        String resourceCategoryName,
        Long locationId,
        String locationName,
        String locationBuilding,
        String locationFloor,
        String locationRoomIdentifier,
        String locationDescription,
        Long ticketCategoryId,
        String ticketCategoryCode,
        String ticketCategoryName,
        String title,
        String description,
        TicketPriority priority,
        TicketStatus status,
        String preferredContactName,
        String preferredContactEmail,
        String preferredContactPhone,
        String resolutionSummary,
        String rejectionReason,
        LocalDateTime firstRespondedAt,
        LocalDateTime resolvedAt,
        LocalDateTime rejectedAt,
        LocalDateTime closedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<TicketAssignmentResponse> assignmentHistory) {}
