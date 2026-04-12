package com.smartcampus.backend.modules.ticket.dto;

import com.smartcampus.backend.common.enums.TicketPriority;
import com.smartcampus.backend.common.enums.TicketStatus;

public record TicketSummaryResponse(
        Long id,
        String ticketNumber,
        Long reporterUserId,
        Long assignedStaffUserId,
        Long resourceId,
        Long locationId,
        String ticketCategoryCode,
        String title,
        TicketPriority priority,
        TicketStatus status) {}
