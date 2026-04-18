package com.smartcampus.backend.modules.adminanalytics.dto;

import java.time.LocalDateTime;
import java.util.List;

public record AdminAnalyticsOverviewResponse(
        AnalyticsRange range,
        LocalDateTime generatedAt,
        List<AnalyticsMetricCardResponse> metrics,
        List<AnalyticsAlertResponse> alerts,
        List<AnalyticsQuickLinkResponse> quickLinks) {}
