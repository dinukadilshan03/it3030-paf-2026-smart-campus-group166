package com.smartcampus.backend.modules.booking.dto;

import com.smartcampus.backend.common.enums.BookingStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record BookingSummaryResponse(
        Long id,
        Long resourceId,
        String resourceCode,
        String resourceName,
        Long requesterUserId,
        String requesterDisplayName,
        LocalDate bookingDate,
        LocalTime startTime,
        LocalTime endTime,
        BookingStatus status,
        Integer expectedAttendees,
        LocalDateTime createdAt) {}
