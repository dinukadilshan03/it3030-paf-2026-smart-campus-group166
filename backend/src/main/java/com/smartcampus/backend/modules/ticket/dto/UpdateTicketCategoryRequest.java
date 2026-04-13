package com.smartcampus.backend.modules.ticket.dto;

import jakarta.validation.constraints.Size;

public record UpdateTicketCategoryRequest(
        @Size(max = 50, message = "Code must be at most 50 characters") String code,
        @Size(max = 100, message = "Name must be at most 100 characters") String name,
        String description,
        Boolean isActive) {}
