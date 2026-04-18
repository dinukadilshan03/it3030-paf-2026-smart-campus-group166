package com.smartcampus.backend.modules.adminanalytics.dto;

import java.util.List;

public record AdminAnalyticsAskResponse(
        boolean available,
        String message,
        String answer,
        double confidence,
        List<String> referencedMetricIds,
        List<AnalyticsQuickLinkResponse> recommendedLinks) {}
