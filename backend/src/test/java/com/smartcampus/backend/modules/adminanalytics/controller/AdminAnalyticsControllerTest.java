package com.smartcampus.backend.modules.adminanalytics.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsAskRequest;
import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsAskResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsChartsResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsHealthResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsInsightsRequest;
import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsInsightsResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsOverviewResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AnalyticsRange;
import com.smartcampus.backend.modules.adminanalytics.service.AdminAnalyticsService;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.prepost.PreAuthorize;

@ExtendWith(MockitoExtension.class)
class AdminAnalyticsControllerTest {

    @Mock private AdminAnalyticsService adminAnalyticsService;

    @InjectMocks private AdminAnalyticsController adminAnalyticsController;

    @Test
    void controllerIsRestrictedToAdmins() {
        PreAuthorize annotation = AdminAnalyticsController.class.getAnnotation(PreAuthorize.class);
        assertThat(annotation).isNotNull();
        assertThat(annotation.value()).isEqualTo("hasRole('ADMIN')");
    }

    @Test
    void resolvesQueryRangesAndDelegatesToService() {
        AdminAnalyticsOverviewResponse overview =
                new AdminAnalyticsOverviewResponse(
                        AnalyticsRange.RANGE_30D, LocalDateTime.now(), List.of(), List.of(), List.of());
        when(adminAnalyticsService.getOverview(AnalyticsRange.RANGE_30D)).thenReturn(overview);

        AdminAnalyticsOverviewResponse response = adminAnalyticsController.getOverview("30D");

        assertThat(response.range()).isEqualTo(AnalyticsRange.RANGE_30D);
    }

    @Test
    void delegatesChartsHealthInsightsAndAskCalls() throws NoSuchMethodException {
        when(adminAnalyticsService.getCharts(AnalyticsRange.RANGE_7D))
                .thenReturn(
                        new AdminAnalyticsChartsResponse(
                                AnalyticsRange.RANGE_7D,
                                LocalDateTime.now(),
                                List.of(),
                                List.of(),
                                List.of(),
                                List.of(),
                                List.of(),
                                List.of(),
                                List.of(),
                                List.of()));
        when(adminAnalyticsService.getHealth(AnalyticsRange.RANGE_7D))
                .thenReturn(
                        new AdminAnalyticsHealthResponse(
                                AnalyticsRange.RANGE_7D,
                                LocalDateTime.now(),
                                List.of(),
                                List.of(),
                                List.of(),
                                List.of(),
                                List.of(),
                                List.of(),
                                List.of()));
        when(adminAnalyticsService.getInsights(AnalyticsRange.RANGE_7D))
                .thenReturn(
                        new AdminAnalyticsInsightsResponse(
                                false, "AI unavailable", "", List.of(), List.of(), List.of(), List.of()));
        when(adminAnalyticsService.ask(AnalyticsRange.RANGE_7D, "What changed?"))
                .thenReturn(
                        new AdminAnalyticsAskResponse(
                                false, "AI unavailable", "", 0.0, List.of(), List.of()));

        assertThat(adminAnalyticsController.getCharts("7D").range()).isEqualTo(AnalyticsRange.RANGE_7D);
        assertThat(adminAnalyticsController.getHealth("7D").range()).isEqualTo(AnalyticsRange.RANGE_7D);
        assertThat(adminAnalyticsController.getInsights(new AdminAnalyticsInsightsRequest(AnalyticsRange.RANGE_7D)).available())
                .isFalse();
        assertThat(
                        adminAnalyticsController
                                .ask(new AdminAnalyticsAskRequest(AnalyticsRange.RANGE_7D, "What changed?"))
                                .available())
                .isFalse();
    }
}
