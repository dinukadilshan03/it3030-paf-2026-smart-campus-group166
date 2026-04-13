package com.smartcampus.backend.modules.resource.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record ResourceAvailabilityWindowRequest(
        @NotNull(message = "Day of week is required")
                @Min(value = 1, message = "Day of week must be between 1 and 7")
                @Max(value = 7, message = "Day of week must be between 1 and 7")
                Short dayOfWeek,
        @NotNull(message = "Start time is required") LocalTime startTime,
        @NotNull(message = "End time is required") LocalTime endTime,
        Boolean isAvailable,
        LocalDate effectiveFrom,
        LocalDate effectiveTo) {}
