package com.smartcampus.backend.modules.ticket.dto;

// Imports the TicketPriority enum used to represent the urgency level of the ticket
import com.smartcampus.backend.common.enums.TicketPriority;

// Imports validation annotations used to validate incoming request data
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// This is a request DTO used when updating the main details of an existing ticket
public record UpdateTicketRequest(

        // Optional resource ID linked to the ticket
        // This can be used when the issue is related to a specific resource
        Long resourceId,

        // Optional location ID linked to the ticket
        // This can be used when the issue is related to a specific place/location
        Long locationId,

        // Required ticket category ID
        //
        // @NotNull ensures the ticket must belong to a category
        // because category is important for classification and routing
        @NotNull(message = "Ticket category is required") Long ticketCategoryId,

        // Required ticket title
        //
        // @NotBlank ensures the title is not null, not empty, and not only whitespace
        // @Size(max = 200) ensures the title length does not exceed 200 characters
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must be at most 200 characters")
        String title,

        // Required ticket description
        //
        // @NotBlank ensures the description cannot be null, empty, or whitespace only
        @NotBlank(message = "Description is required") String description,

        // Required ticket priority
        //
        // @NotNull ensures the system always receives a valid priority value
        @NotNull(message = "Priority is required") TicketPriority priority,

        // Optional preferred contact name
        //
        // @Size(max = 160) limits the name length if provided
        @Size(max = 160, message = "Preferred contact name must be at most 160 characters")
        String preferredContactName,

        // Optional preferred contact email
        //
        // @Email validates the format if an email value is provided
        @Email(message = "Preferred contact email must be valid") String preferredContactEmail,

        // Optional preferred contact phone number
        //
        // @Size(max = 30) limits the maximum phone number length if provided
        @Size(max = 30, message = "Preferred contact phone must be at most 30 characters")
        String preferredContactPhone) {}