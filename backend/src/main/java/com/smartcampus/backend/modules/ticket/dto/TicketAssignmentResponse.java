package com.smartcampus.backend.modules.ticket.dto;

import java.time.LocalDateTime;

public record TicketAssignmentResponse(
        Long id,
        Long assignedToUserId,
        String assignedToDisplayName,
        Long assignedByUserId,
        String assignedByDisplayName,
        String assignmentNote,
        Boolean isActive,
        LocalDateTime assignedAt,
        LocalDateTime unassignedAt) {}
