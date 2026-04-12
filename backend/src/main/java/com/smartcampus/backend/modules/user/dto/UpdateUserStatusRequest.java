package com.smartcampus.backend.modules.user.dto;

import com.smartcampus.backend.common.enums.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(@NotNull(message = "Status is required") UserStatus status) {}
