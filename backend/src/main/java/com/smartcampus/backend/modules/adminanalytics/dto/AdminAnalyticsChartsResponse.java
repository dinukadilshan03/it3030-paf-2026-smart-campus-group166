package com.smartcampus.backend.modules.adminanalytics.dto;

import java.time.LocalDateTime;
import java.util.List;

public record AdminAnalyticsChartsResponse(
        AnalyticsRange range,
        LocalDateTime generatedAt,
        List<AnalyticsSeriesPointResponse> bookingsByDay,
        List<AnalyticsSeriesPointResponse> peakBookingHours,
        List<AnalyticsSeriesPointResponse> topResources,
        List<AnalyticsSeriesPointResponse> topLocations,
        List<AnalyticsSeriesPointResponse> ticketsByDay,
        List<AnalyticsSeriesPointResponse> ticketCategories,
        List<AnalyticsSeriesPointResponse> notificationTypes,
        List<AnalyticsSeriesPointResponse> authEventsByType) {}
