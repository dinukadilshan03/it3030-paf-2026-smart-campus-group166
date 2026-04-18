package com.smartcampus.backend.modules.adminanalytics.dto;

import java.util.List;

public record AdminAnalyticsInsightsResponse(
        boolean available,
        String message,
        String summary,
        List<AnalyticsInsightItemResponse> highlights,
        List<AnalyticsInsightItemResponse> anomalies,
        List<AnalyticsInsightItemResponse> recommendations,
        List<String> followUpQuestions) {}
