package com.smartcampus.backend.modules.booking.dto;

import jakarta.validation.constraints.NotNull;

public record ReviewBookingRequest(
        @NotNull(message = "Review decision is required") BookingReviewDecision decision,
        String reason) {}
