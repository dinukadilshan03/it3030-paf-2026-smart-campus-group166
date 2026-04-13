package com.smartcampus.backend.modules.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetLocalPasswordRequest(
        @NotBlank(message = "Temporary password is required")
                @Size(min = 8, message = "Temporary password must be at least 8 characters")
                @Size(max = 255, message = "Temporary password must be at most 255 characters")
                String temporaryPassword) {}
