package com.smartcampus.backend.modules.resource.dto;

import com.smartcampus.backend.common.enums.ResourceStatus;

public record ResourceDetailResponse(
        Long id,
        String resourceCode,
        String name,
        String description,
        Integer capacity,
        ResourceStatus status,
        Boolean requiresApproval,
        String imageUrl,
        String notes,
        ResourceCategorySummaryResponse category,
        LocationSummaryResponse location) {}
