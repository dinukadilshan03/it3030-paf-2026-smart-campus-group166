package com.smartcampus.backend.modules.ticket.dto;

// Imports validation annotations used for input validation
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// This is a request DTO used when the user sends a natural-language
// request to the ticket report assistant for interpretation
public record TicketReportAssistantInterpretRequest(

        // The assistant request/message entered by the user
        //
        // @NotBlank ensures the field is not null, not empty,
        // and not just whitespace
        //
        // @Size(max = 2000) ensures the message does not exceed
        // 2000 characters, which helps control input size and
        // prevents overly large requests
        @NotBlank(message = "Assistant request is required")
        @Size(max = 2000, message = "Assistant request must be 2000 characters or fewer")
        String message) {}