package com.smartcampus.backend.modules.ticket.dto;

public record TicketReportAssistantResponse(
        boolean assistantEnabled,
        boolean needsClarification,
        String clarificationQuestion,
        String interpretationSummary,
        GenerateTicketReportRequest interpretedRequest) {}
