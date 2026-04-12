package com.smartcampus.backend.modules.resource.dto;

public record ResourceCategoryDetailResponse(
        Long id,
        String code,
        String name,
        String description,
        Boolean isActive) {}
