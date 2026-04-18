package com.smartcampus.backend.modules.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TicketReportAssistantInterpretRequest(
        @NotBlank(message = "Assistant request is required")
                @Size(max = 2000, message = "Assistant request must be 2000 characters or fewer")
                String message) {}
