package com.smartcampus.backend.modules.ticket.dto;

import com.smartcampus.backend.common.enums.TicketPriority;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTicketRequest(
        // Optional ID of the user who is reporting the ticket
        Long reporterUserId,

        // Optional related resource ID linked to the ticket
        Long resourceId,

        // Optional location ID associated with the ticket
        Long locationId,

        // Ticket category is required to classify the issue
        @NotNull(message = "Ticket category is required") Long ticketCategoryId,

        // Ticket title is required and limited to 200 characters
        @NotBlank(message = "Title is required")
                @Size(max = 200, message = "Title must be at most 200 characters")
                String title,

        // Detailed description of the issue is required
        @NotBlank(message = "Description is required") String description,

        // Ticket priority is required to indicate urgency
        @NotNull(message = "Priority is required") TicketPriority priority,

        // Optional preferred contact name, limited to 160 characters
        @Size(max = 160, message = "Preferred contact name must be at most 160 characters")
                String preferredContactName,

        // Optional preferred contact email, must be valid if provided
        @Email(message = "Preferred contact email must be valid") String preferredContactEmail,

        // Optional preferred contact phone number, limited to 30 characters
        @Size(max = 30, message = "Preferred contact phone must be at most 30 characters")
                String preferredContactPhone) {}