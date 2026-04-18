package com.smartcampus.backend.modules.ticket.dto;

import com.smartcampus.backend.common.enums.TicketPriority;
import com.smartcampus.backend.common.enums.TicketStatus;
import java.time.LocalDateTime;

public record TicketSummaryResponse(
        Long id,
        String ticketNumber,
        Long reporterUserId,
        String reporterDisplayName,
        Long assignedStaffUserId,
        String assignedStaffDisplayName,
        Long resourceId,
        String resourceName,
        Long locationId,
        String locationName,
        Long ticketCategoryId,
        String ticketCategoryCode,
        String ticketCategoryName,
        String title,
        TicketPriority priority,
        TicketStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime firstRespondedAt,
        LocalDateTime resolvedAt,
        Integer reconsiderationRequestCount,
        Integer staffReviewCount,
        Integer adminReviewCount) {}
