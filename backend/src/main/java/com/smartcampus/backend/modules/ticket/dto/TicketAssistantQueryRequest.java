package com.smartcampus.backend.modules.ticket.dto;

import jakarta.validation.constraints.NotBlank;

public record TicketAssistantQueryRequest(
        @NotBlank(message = "Assistant message is required") String message,
        Long selectedTicketId) {}
