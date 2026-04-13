package com.smartcampus.backend.modules.user.dto;

import com.smartcampus.backend.common.enums.RoleCode;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(@NotNull(message = "Role is required") RoleCode role) {}
