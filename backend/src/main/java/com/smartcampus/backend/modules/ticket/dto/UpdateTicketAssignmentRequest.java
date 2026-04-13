package com.smartcampus.backend.modules.ticket.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateTicketAssignmentRequest(
        @NotNull(message = "Assigned staff user is required") Long assignedStaffUserId,
        String assignmentNote) {}
