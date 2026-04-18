package com.smartcampus.backend.modules.ticket.dto;

public record TicketReportDownloadPayload(String fileName, String mimeType, byte[] fileData) {}
