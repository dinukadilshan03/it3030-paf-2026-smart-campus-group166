package com.smartcampus.backend.modules.adminanalytics.controller;

import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsAskRequest;
import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsAskResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsChartsResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsHealthResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsInsightsRequest;
import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsInsightsResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsOverviewResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AnalyticsRange;
import com.smartcampus.backend.modules.adminanalytics.service.AdminAnalyticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    @GetMapping("/overview")
    public AdminAnalyticsOverviewResponse getOverview(@RequestParam(defaultValue = "30D") String range) {
        return adminAnalyticsService.getOverview(AnalyticsRange.fromValue(range));
    }

    @GetMapping("/charts")
    public AdminAnalyticsChartsResponse getCharts(@RequestParam(defaultValue = "30D") String range) {
        return adminAnalyticsService.getCharts(AnalyticsRange.fromValue(range));
    }

    @GetMapping("/health")
    public AdminAnalyticsHealthResponse getHealth(@RequestParam(defaultValue = "30D") String range) {
        return adminAnalyticsService.getHealth(AnalyticsRange.fromValue(range));
    }

    @PostMapping("/insights")
    public AdminAnalyticsInsightsResponse getInsights(
            @Valid @RequestBody AdminAnalyticsInsightsRequest request) {
        return adminAnalyticsService.getInsights(request.range());
    }

    @PostMapping("/ask")
    public AdminAnalyticsAskResponse ask(@Valid @RequestBody AdminAnalyticsAskRequest request) {
        return adminAnalyticsService.ask(request.range(), request.question());
    }
}
