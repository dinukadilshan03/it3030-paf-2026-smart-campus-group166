package com.smartcampus.backend.modules.adminanalytics.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AdminAnalyticsAskRequest(
        @NotNull AnalyticsRange range,
        @NotBlank(message = "Question is required") String question) {}
