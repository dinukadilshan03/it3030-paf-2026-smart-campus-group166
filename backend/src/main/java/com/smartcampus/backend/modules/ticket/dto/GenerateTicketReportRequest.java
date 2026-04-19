package com.smartcampus.backend.modules.ticket.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.smartcampus.backend.common.enums.TicketPriority;
import com.smartcampus.backend.common.enums.TicketReportFormat;
import com.smartcampus.backend.common.enums.TicketReportType;
import com.smartcampus.backend.common.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record GenerateTicketReportRequest(
        // Optional ticket ID for generating a report for a specific ticket
        Long ticketId,

        // Optional ticket number as an alternative identifier
        String ticketNumber,

        // Report type is required to determine what kind of report to generate
        @NotNull(message = "Report type is required") TicketReportType reportType,

        // Report format is required to specify the output format
        @NotNull(message = "Report format is required") TicketReportFormat format,

        // Optional filter by ticket status
        TicketStatus status,

        // Optional filter by ticket priority
        TicketPriority priority,

        // Optional filter by ticket category
        Long ticketCategoryId,

        // Optional filter by location
        Long locationId,

        // Optional filter by related resource
        Long resourceId,

        // Optional filter by assigned staff member
        Long assignedStaffUserId,

        // Optional filter by reporter user
        Long reporterUserId,

        // Optional start date for filtering report data
        @JsonFormat(pattern = "yyyy-MM-dd") LocalDate startDate,

        // Optional end date for filtering report data
        @JsonFormat(pattern = "yyyy-MM-dd") LocalDate endDate,

        // Optional natural language request for flexible report generation
        String naturalLanguageRequest) {}