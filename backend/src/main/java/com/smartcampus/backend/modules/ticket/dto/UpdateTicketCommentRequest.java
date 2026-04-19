package com.smartcampus.backend.modules.ticket.dto;

// Imports the @NotBlank validation annotation
// This ensures the field cannot be null, empty, or only whitespace
import jakarta.validation.constraints.NotBlank;

// This is a request DTO used when updating/editing an existing ticket comment
public record UpdateTicketCommentRequest(

        // The updated comment text/body
        //
        // @NotBlank ensures that the updated comment cannot be null,
        // empty, or only whitespace
        //
        // This validation is important because a comment edit should still
        // contain meaningful content after the update
        @NotBlank(message = "Comment body is required") String body) {}