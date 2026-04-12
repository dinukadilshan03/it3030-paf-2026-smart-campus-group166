package com.smartcampus.backend.modules.auth.dto;

import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;

public record CurrentUserResponse(
        boolean authenticated,
        Long id,
        String email,
        String displayName,
        RoleCode role,
        UserStatus status) {}
