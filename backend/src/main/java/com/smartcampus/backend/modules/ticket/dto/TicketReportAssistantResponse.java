package com.smartcampus.backend.modules.ticket.dto;

// This is a response DTO used to send the result of the
// ticket report assistant interpretation back to the frontend
public record TicketReportAssistantResponse(

        // Indicates whether the assistant feature is enabled or available
        // true  = assistant is available
        // false = assistant is disabled or unavailable
        boolean assistantEnabled,

        // Indicates whether the assistant needs more information
        // from the user before it can complete the interpretation
        // true  = more clarification is needed
        // false = enough information was provided
        boolean needsClarification,

        // If clarification is needed, this contains the follow-up question
        // that should be shown to the user
        String clarificationQuestion,

        // A human-readable summary of how the assistant understood
        // the user's request
        String interpretationSummary,

        // A structured report-generation request produced by the assistant
        // This can be used directly by the system to generate the report
        GenerateTicketReportRequest interpretedRequest) {}