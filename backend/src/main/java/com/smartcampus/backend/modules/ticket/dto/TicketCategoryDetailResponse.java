package com.smartcampus.backend.modules.ticket.dto;

// Imports LocalDateTime to represent date and time values
import java.time.LocalDateTime;

// This is a response DTO used to send full ticket category details
// from the backend to the frontend
public record TicketCategoryDetailResponse(

        // Unique ID of the ticket category
        Long id,

        // Short unique code for the category
        // Example: HARDWARE, NETWORK, SOFTWARE
        String code,

        // Human-readable category name
        String name,

        // Description explaining what this category is for
        String description,

        // Indicates whether the category is currently active
        // true  = category can be used
        // false = category is inactive / disabled
        Boolean isActive,

        // Date and time when this category was created
        LocalDateTime createdAt,

        // Date and time when this category was last updated
        LocalDateTime updatedAt) {}