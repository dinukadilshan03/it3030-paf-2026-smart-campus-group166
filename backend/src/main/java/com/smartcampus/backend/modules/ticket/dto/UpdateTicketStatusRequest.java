package com.smartcampus.backend.modules.ticket.dto;

import com.smartcampus.backend.common.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateTicketStatusRequest(
        @NotNull(message = "Target status is required") TicketStatus status,
        String resolutionSummary,
        String rejectionReason) {}
