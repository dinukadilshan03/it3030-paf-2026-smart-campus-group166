package com.smartcampus.backend.modules.adminanalytics.dto;

import jakarta.validation.constraints.NotNull;

public record AdminAnalyticsInsightsRequest(@NotNull AnalyticsRange range) {}
