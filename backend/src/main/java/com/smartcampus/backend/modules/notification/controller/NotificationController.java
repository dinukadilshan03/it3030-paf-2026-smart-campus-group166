package com.smartcampus.backend.modules.notification.controller;

import com.smartcampus.backend.modules.notification.dto.NotificationSummaryResponse;
import com.smartcampus.backend.modules.notification.dto.NotificationUnreadCountResponse;
import com.smartcampus.backend.modules.notification.service.NotificationService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public List<NotificationSummaryResponse> getNotifications(
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Boolean unreadOnly) {
        return notificationService.getNotifications(limit, unreadOnly);
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public NotificationUnreadCountResponse getUnreadCount() {
        return notificationService.getUnreadCount();
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public NotificationSummaryResponse markAsRead(@PathVariable Long id) {
        return notificationService.markAsRead(id);
    }

    @PatchMapping("/read-all")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllAsRead() {
        notificationService.markAllAsRead();
    }
}
