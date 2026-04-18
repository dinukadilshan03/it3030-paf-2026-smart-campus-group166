package com.smartcampus.backend.modules.notification.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.common.enums.NotificationReferenceType;
import com.smartcampus.backend.common.enums.NotificationType;
import com.smartcampus.backend.modules.notification.dto.NotificationSummaryResponse;
import com.smartcampus.backend.modules.notification.dto.NotificationUnreadCountResponse;
import com.smartcampus.backend.modules.notification.service.NotificationService;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.prepost.PreAuthorize;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock private NotificationService notificationService;

    @InjectMocks private NotificationController notificationController;

    @Test
    void notificationsEndpointsAreRestrictedToAuthenticatedRoles() throws NoSuchMethodException {
        assertHasSharedRoleGuard(
                NotificationController.class.getDeclaredMethod(
                        "getNotifications", Integer.class, Boolean.class));
        assertHasSharedRoleGuard(
                NotificationController.class.getDeclaredMethod("getUnreadCount"));
        assertHasSharedRoleGuard(
                NotificationController.class.getDeclaredMethod("markAsRead", Long.class));
        assertHasSharedRoleGuard(
                NotificationController.class.getDeclaredMethod("markAllAsRead"));
    }

    @Test
    void returnsNotificationsFromService() {
        NotificationSummaryResponse summary =
                new NotificationSummaryResponse(
                        1L,
                        NotificationType.TICKET,
                        "Ticket status updated",
                        "TCK-1 is now resolved",
                        NotificationReferenceType.TICKET,
                        10L,
                        false,
                        LocalDateTime.now());
        when(notificationService.getNotifications(5, true)).thenReturn(List.of(summary));

        List<NotificationSummaryResponse> notifications =
                notificationController.getNotifications(5, true);

        assertThat(notifications).hasSize(1);
        assertThat(notifications.getFirst().referenceId()).isEqualTo(10L);
    }

    @Test
    void returnsUnreadCountFromService() {
        when(notificationService.getUnreadCount()).thenReturn(new NotificationUnreadCountResponse(3));

        NotificationUnreadCountResponse response = notificationController.getUnreadCount();

        assertThat(response.unreadCount()).isEqualTo(3);
    }

    private void assertHasSharedRoleGuard(Method method) {
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);
        assertThat(annotation).isNotNull();
        assertThat(annotation.value()).isEqualTo("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')");
    }
}
