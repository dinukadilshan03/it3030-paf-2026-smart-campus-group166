package com.smartcampus.backend.modules.ticket.dto;

import com.smartcampus.backend.common.enums.TicketReportFormat;
import com.smartcampus.backend.common.enums.TicketReportStatus;
import com.smartcampus.backend.common.enums.TicketReportType;
import java.time.LocalDateTime;

public record TicketReportResponse(
        Long id,
        Long generatedByUserId,
        String generatedByDisplayName,
        TicketReportType reportType,
        TicketReportFormat format,
        TicketReportStatus status,
        Integer recordCount,
        String fileName,
        String mimeType,
        String ticketNumber,
        String ticketTitle,
        String filterSummary,
        String summaryText,
        String naturalLanguageRequest,
        LocalDateTime generatedAt) {}
