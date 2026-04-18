package com.smartcampus.backend.modules.ticket.dto;

import jakarta.validation.constraints.NotBlank;

public record RequestTicketReconsiderationRequest(
        @NotBlank(message = "Reconsideration note is required") String note) {}
