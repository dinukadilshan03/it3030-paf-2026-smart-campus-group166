package com.smartcampus.backend.modules.adminanalytics.dto;

import java.util.List;

public record AnalyticsInsightItemResponse(String text, List<String> referencedMetricIds) {}
