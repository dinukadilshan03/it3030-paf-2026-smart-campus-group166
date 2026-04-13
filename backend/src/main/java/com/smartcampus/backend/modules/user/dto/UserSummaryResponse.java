package com.smartcampus.backend.modules.user.dto;

import com.smartcampus.backend.common.enums.UserLoginMethod;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import java.time.LocalDateTime;

public record UserSummaryResponse(
        Long id,
        String email,
        String displayName,
        RoleCode role,
        UserStatus status,
        LocalDateTime lastLoginAt,
        boolean hasLocalCredentials,
        boolean mustChangePassword,
        UserLoginMethod loginMethod) {}
