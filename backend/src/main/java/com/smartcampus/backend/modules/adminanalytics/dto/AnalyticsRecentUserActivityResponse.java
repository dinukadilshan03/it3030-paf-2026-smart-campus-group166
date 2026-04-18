package com.smartcampus.backend.modules.adminanalytics.dto;

import com.smartcampus.backend.common.enums.RoleCode;
import java.time.LocalDateTime;

public record AnalyticsRecentUserActivityResponse(
        Long id,
        String displayName,
        String email,
        RoleCode role,
        LocalDateTime lastLoginAt,
        String href) {}
