package com.smartcampus.backend.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Current password is required")
                @Size(max = 255, message = "Current password must be at most 255 characters")
                String currentPassword,
        @NotBlank(message = "New password is required")
                @Size(min = 8, message = "New password must be at least 8 characters")
                @Size(max = 255, message = "New password must be at most 255 characters")
                String newPassword) {}
