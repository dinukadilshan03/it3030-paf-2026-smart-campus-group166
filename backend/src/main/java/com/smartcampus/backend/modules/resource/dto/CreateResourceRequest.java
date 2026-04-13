package com.smartcampus.backend.modules.resource.dto;

import com.smartcampus.backend.common.enums.ResourceStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateResourceRequest(
        @NotNull(message = "Resource category is required") Long resourceCategoryId,
        @NotNull(message = "Location is required") Long locationId,
        @NotBlank(message = "Resource code is required")
                @Size(max = 50, message = "Resource code must be at most 50 characters")
                String resourceCode,
        @NotBlank(message = "Name is required")
                @Size(max = 150, message = "Name must be at most 150 characters")
                String name,
        String description,
        @Min(value = 0, message = "Capacity must be non-negative") Integer capacity,
        @NotNull(message = "Status is required") ResourceStatus status,
        Boolean requiresApproval,
        String notes,
        @Size(max = 500, message = "Image URL must be at most 500 characters") String imageUrl) {}
