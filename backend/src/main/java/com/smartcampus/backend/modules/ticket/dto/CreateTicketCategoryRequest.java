package com.smartcampus.backend.modules.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTicketCategoryRequest(
        // Category code is required and cannot be blank
        @NotBlank(message = "Code is required")
                // Limit code length to 50 characters
                @Size(max = 50, message = "Code must be at most 50 characters")
                String code,

        // Category name is required and cannot be blank
        @NotBlank(message = "Name is required")
                // Limit name length to 100 characters
                @Size(max = 100, message = "Name must be at most 100 characters")
                String name,

        // Optional description for the ticket category
        String description,

        // Optional flag to indicate whether the category is active
        Boolean isActive) {}