package com.smartcampus.backend.modules.notification.mapper;

import com.smartcampus.backend.modules.notification.dto.NotificationSummaryResponse;
import com.smartcampus.backend.modules.notification.entity.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationSummaryResponse toSummary(Notification notification) {
        return new NotificationSummaryResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getReferenceType(),
                notification.getReferenceId(),
                notification.getIsRead(),
                notification.getCreatedAt());
    }
}
