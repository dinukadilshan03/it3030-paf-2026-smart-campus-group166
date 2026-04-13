package com.smartcampus.backend.modules.user.dto;

import com.smartcampus.backend.common.enums.UserLoginMethod;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import java.time.LocalDateTime;

public record UserDetailResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        String displayName,
        String phone,
        String profileImageUrl,
        RoleCode role,
        UserStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime lastLoginAt,
        boolean hasLocalCredentials,
        boolean mustChangePassword,
        UserLoginMethod loginMethod) {}
