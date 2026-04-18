package com.smartcampus.backend.modules.ticket.dto;

public record RefineTicketDescriptionResponse(
        boolean assistantEnabled,
        String improvedDescription) {}
