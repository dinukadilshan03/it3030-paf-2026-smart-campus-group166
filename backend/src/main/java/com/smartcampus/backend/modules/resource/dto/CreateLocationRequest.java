package com.smartcampus.backend.modules.resource.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateLocationRequest(
        @NotBlank(message = "Code is required")
                @Size(max = 50, message = "Code must be at most 50 characters")
                String code,
        @NotBlank(message = "Name is required")
                @Size(max = 150, message = "Name must be at most 150 characters")
                String name,
        @Size(max = 150, message = "Building must be at most 150 characters") String building,
        @Size(max = 50, message = "Floor must be at most 50 characters") String floor,
        @Size(max = 50, message = "Room identifier must be at most 50 characters")
                String roomIdentifier,
        String description) {}
