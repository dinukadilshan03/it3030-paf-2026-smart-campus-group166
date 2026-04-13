package com.smartcampus.backend.modules.user.dto;

import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank(message = "Email is required")
                @Email(message = "Email must be valid")
                @Size(max = 255, message = "Email must be at most 255 characters")
                String email,
        @Size(max = 120, message = "First name must be at most 120 characters") String firstName,
        @Size(max = 120, message = "Last name must be at most 120 characters") String lastName,
        @Size(max = 160, message = "Display name must be at most 160 characters") String displayName,
        @Size(max = 30, message = "Phone must be at most 30 characters")
                @Pattern(regexp = "^[+0-9()\\-\\s]*$", message = "Phone format is invalid")
                String phone,
        @Size(max = 500, message = "Profile image URL must be at most 500 characters")
                String profileImageUrl,
        @NotNull(message = "Role is required") RoleCode role,
        UserStatus status) {}
