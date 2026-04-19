package com.smartcampus.backend.modules.ticket.dto;

// This is a DTO used internally when returning downloadable report data
// from the service layer to the controller
public record TicketReportDownloadPayload(

        // Name of the file that should be used when the report is downloaded
        // Example: ticket-report-april-2026.pdf
        String fileName,

        // MIME type of the file
        // Example: application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
        String mimeType,

        // Actual binary content of the file
        // This byte array contains the full report data that will be sent in the HTTP response
        byte[] fileData) {}