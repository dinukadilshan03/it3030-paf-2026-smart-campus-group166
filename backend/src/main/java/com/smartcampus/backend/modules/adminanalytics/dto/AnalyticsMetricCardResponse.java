package com.smartcampus.backend.modules.adminanalytics.dto;

public record AnalyticsMetricCardResponse(
        String id,
        String label,
        String value,
        String changeLabel,
        String trend,
        String href) {}
