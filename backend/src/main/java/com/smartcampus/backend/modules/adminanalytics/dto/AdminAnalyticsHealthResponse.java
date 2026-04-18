package com.smartcampus.backend.modules.adminanalytics.dto;

import java.time.LocalDateTime;
import java.util.List;

public record AdminAnalyticsHealthResponse(
        AnalyticsRange range,
        LocalDateTime generatedAt,
        List<AnalyticsNamedValueResponse> roleDistribution,
        List<AnalyticsNamedValueResponse> statusDistribution,
        List<AnalyticsNamedValueResponse> loginMethodDistribution,
        List<AnalyticsNamedValueResponse> authHealth,
        List<AnalyticsNamedValueResponse> notificationHealth,
        List<AnalyticsAlertResponse> flags,
        List<AnalyticsRecentUserActivityResponse> recentSignIns) {}
