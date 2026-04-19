package com.smartcampus.backend.modules.ticket.dto;

// Imports the @NotBlank validation annotation
// This ensures the field cannot be null, empty, or only whitespace
import jakarta.validation.constraints.NotBlank;

// This is a request DTO used when sending a query/message
// to the ticket assistant feature
public record TicketAssistantQueryRequest(

        // The main message or question sent to the assistant
        // @NotBlank ensures that the user must enter a message
        // and cannot send null, empty, or whitespace-only input
        @NotBlank(message = "Assistant message is required") String message,

        // Optional selected ticket ID
        // This can be used when the assistant query is related to
        // a specific existing ticket
        //
        // It is nullable because the assistant may also handle
        // general queries that are not tied to one ticket
        Long selectedTicketId) {}