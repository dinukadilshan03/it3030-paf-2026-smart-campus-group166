package com.smartcampus.backend.modules.adminanalytics.dto;

import java.util.List;

public record AnalyticsAlertResponse(
        String id,
        String title,
        String message,
        String severity,
        String href,
        List<String> referencedMetricIds) {}
