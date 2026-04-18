package com.smartcampus.backend.modules.ticket.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.smartcampus.backend.common.enums.TicketPriority;
import com.smartcampus.backend.common.enums.TicketReportFormat;
import com.smartcampus.backend.common.enums.TicketReportType;
import com.smartcampus.backend.common.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record GenerateTicketReportRequest(
        Long ticketId,
        String ticketNumber,
        @NotNull(message = "Report type is required") TicketReportType reportType,
        @NotNull(message = "Report format is required") TicketReportFormat format,
        TicketStatus status,
        TicketPriority priority,
        Long ticketCategoryId,
        Long locationId,
        Long resourceId,
        Long assignedStaffUserId,
        Long reporterUserId,
        @JsonFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
        @JsonFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
        String naturalLanguageRequest) {}
