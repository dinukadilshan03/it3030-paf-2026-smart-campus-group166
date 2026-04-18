package com.smartcampus.backend.modules.ticket.dto;

import com.smartcampus.backend.common.enums.TicketAssistantIntent;
import com.smartcampus.backend.common.enums.TicketPriority;
import java.util.List;

public record TicketAssistantResponse(
        boolean assistantEnabled,
        TicketAssistantIntent intent,
        String title,
        String message,
        List<String> highlights,
        List<String> suggestedActions,
        List<TicketSummaryResponse> relatedTickets,
        String suggestedComment,
        String improvedDescription,
        TicketPriority recommendedPriority,
        Long recommendedCategoryId,
        String recommendedCategoryCode,
        String recommendedCategoryName,
        GenerateTicketReportRequest reportSuggestion,
        String reportSuggestionSummary) {}
