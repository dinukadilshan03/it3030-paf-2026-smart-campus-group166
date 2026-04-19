package com.smartcampus.backend.modules.ticket.dto;

// This is a response DTO used to send the refined description result
// from the backend to the frontend after the assistant processes it
public record RefineTicketDescriptionResponse(

        // Indicates whether the assistant feature is enabled or available
        // true  = assistant is enabled and can refine descriptions
        // false = assistant is disabled or unavailable
        boolean assistantEnabled,

        // Contains the improved/refined version of the original ticket description
        // This is the text returned to the frontend after processing
        String improvedDescription) {}