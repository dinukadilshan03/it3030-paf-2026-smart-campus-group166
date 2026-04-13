package com.smartcampus.backend.modules.resource.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record ResourceAvailabilityWindowResponse(
        Long id,
        Short dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        Boolean isAvailable,
        LocalDate effectiveFrom,
        LocalDate effectiveTo) {}
