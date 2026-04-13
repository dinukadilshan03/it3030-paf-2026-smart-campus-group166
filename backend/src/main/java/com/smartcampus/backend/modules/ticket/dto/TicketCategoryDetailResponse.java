package com.smartcampus.backend.modules.ticket.dto;

import java.time.LocalDateTime;

public record TicketCategoryDetailResponse(
        Long id,
        String code,
        String name,
        String description,
        Boolean isActive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {}
