package com.smartcampus.backend.modules.resource.dto;

import com.smartcampus.backend.common.enums.ResourceStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateResourceRequest(
        Long resourceCategoryId,
        Long locationId,
        @Size(max = 50, message = "Resource code must be at most 50 characters") String resourceCode,
        @Size(max = 150, message = "Name must be at most 150 characters") String name,
        String description,
        @Min(value = 0, message = "Capacity must be non-negative") Integer capacity,
        ResourceStatus status,
        Boolean requiresApproval,
        String notes,
        @Size(max = 500, message = "Image URL must be at most 500 characters") String imageUrl) {}
