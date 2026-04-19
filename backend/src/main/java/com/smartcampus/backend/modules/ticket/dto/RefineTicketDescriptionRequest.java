package com.smartcampus.backend.modules.ticket.dto;

import jakarta.validation.constraints.NotBlank;

public record RefineTicketDescriptionRequest(
        // Optional ticket title to provide additional context
        String title,

        // Ticket description is required and cannot be blank
        @NotBlank(message = "Ticket description is required") String description) {}