package com.smartcampus.backend.modules.ticket.dto;

public record TicketCategorySummaryResponse(
        Long id, String code, String name, String description, Boolean isActive) {}
