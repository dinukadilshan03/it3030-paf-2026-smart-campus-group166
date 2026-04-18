package com.smartcampus.backend.modules.ticket.dto;

import jakarta.validation.constraints.NotBlank;

public record RefineTicketDescriptionRequest(
        String title,
        @NotBlank(message = "Ticket description is required") String description) {}
