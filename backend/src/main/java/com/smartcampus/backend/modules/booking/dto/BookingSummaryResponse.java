package com.smartcampus.backend.modules.booking.dto;

import com.smartcampus.backend.common.enums.BookingStatus;
import java.time.LocalDate;
import java.time.LocalTime;

public record BookingSummaryResponse(
        Long id,
        Long resourceId,
        String resourceName,
        Long requesterUserId,
        LocalDate bookingDate,
        LocalTime startTime,
        LocalTime endTime,
        BookingStatus status) {}
