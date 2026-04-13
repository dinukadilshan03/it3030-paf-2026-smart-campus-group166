package com.smartcampus.backend.modules.ticket.dto;

import com.smartcampus.backend.common.enums.TicketPriority;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTicketRequest(
        Long resourceId,
        Long locationId,
        @NotNull(message = "Ticket category is required") Long ticketCategoryId,
        @NotBlank(message = "Title is required")
                @Size(max = 200, message = "Title must be at most 200 characters")
                String title,
        @NotBlank(message = "Description is required") String description,
        TicketPriority priority,
        @Size(max = 160, message = "Preferred contact name must be at most 160 characters")
                String preferredContactName,
        @Email(message = "Preferred contact email must be valid") String preferredContactEmail,
        @Size(max = 30, message = "Preferred contact phone must be at most 30 characters")
                String preferredContactPhone) {}
