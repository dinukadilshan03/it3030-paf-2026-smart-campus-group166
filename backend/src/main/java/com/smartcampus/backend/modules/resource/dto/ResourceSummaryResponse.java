package com.smartcampus.backend.modules.resource.dto;

import com.smartcampus.backend.common.enums.ResourceStatus;

public record ResourceSummaryResponse(
        Long id,
        String resourceCode,
        String name,
        Long categoryId,
        String categoryCode,
        String categoryName,
        Long locationId,
        String locationCode,
        String locationName,
        Integer capacity,
        ResourceStatus status,
        Boolean requiresApproval,
        String imageUrl) {}
