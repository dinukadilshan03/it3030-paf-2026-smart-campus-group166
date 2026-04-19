package com.smartcampus.backend.modules.ticket.dto;

// Imports the enum that represents the report file format
// Example: PDF, CSV, EXCEL
import com.smartcampus.backend.common.enums.TicketReportFormat;

// Imports the enum that represents the current report generation status
// Example: PENDING, GENERATED, FAILED
import com.smartcampus.backend.common.enums.TicketReportStatus;

// Imports the enum that represents the type of report
// Example: summary report, detailed report, ticket-specific report
import com.smartcampus.backend.common.enums.TicketReportType;

// Imports LocalDateTime to store the date and time when the report was generated
import java.time.LocalDateTime;

// This is a response DTO used to send ticket report details
// from the backend to the frontend
public record TicketReportResponse(

        // Unique ID of the report
        Long id,

        // ID of the user who generated the report
        Long generatedByUserId,

        // Display name of the user who generated the report
        String generatedByDisplayName,

        // Type of report generated
        TicketReportType reportType,

        // Output format of the report file
        TicketReportFormat format,

        // Current status of the report
        TicketReportStatus status,

        // Number of records included in the report
        Integer recordCount,

        // Name of the generated file
        String fileName,

        // MIME type of the generated file
        // Example: application/pdf, text/csv
        String mimeType,

        // Ticket number if this report is related to a specific ticket
        String ticketNumber,

        // Ticket title if this report is related to a specific ticket
        String ticketTitle,

        // Human-readable summary of any filters used when generating the report
        String filterSummary,

        // Short summary text about the report content
        String summaryText,

        // Original natural-language request used to generate or interpret the report
        String naturalLanguageRequest,

        // Date and time when the report was generated
        LocalDateTime generatedAt) {}