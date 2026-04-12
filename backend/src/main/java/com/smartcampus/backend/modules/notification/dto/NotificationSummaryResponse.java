package com.smartcampus.backend.modules.notification.dto;

import com.smartcampus.backend.common.enums.NotificationReferenceType;
import com.smartcampus.backend.common.enums.NotificationType;
import java.time.LocalDateTime;

public record NotificationSummaryResponse(
        Long id,
        NotificationType type,
        String title,
        String message,
        NotificationReferenceType referenceType,
        Long referenceId,
        Boolean isRead,
        LocalDateTime createdAt) {}
