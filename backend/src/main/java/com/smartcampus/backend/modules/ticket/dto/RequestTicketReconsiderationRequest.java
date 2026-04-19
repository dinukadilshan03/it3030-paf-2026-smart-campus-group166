package com.smartcampus.backend.modules.ticket.dto;

// Imports the @NotBlank validation annotation
// This ensures the field cannot be null, empty, or only whitespace
import jakarta.validation.constraints.NotBlank;

// This is a request DTO used when a user asks for ticket reconsideration
// It is written as a Java record, which is good for simple request/response objects
public record RequestTicketReconsiderationRequest(

        // The reconsideration note/reason provided by the user
        // @NotBlank ensures the user must enter a meaningful note
        // If the field is empty, the validation message will be:
        // "Reconsideration note is required"
        @NotBlank(message = "Reconsideration note is required") String note) {}