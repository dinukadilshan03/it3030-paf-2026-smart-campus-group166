package com.smartcampus.backend.modules.resource.dto;

public record ResourceCategorySummaryResponse(
        Long id,
        String code,
        String name,
        Boolean isActive) {}
