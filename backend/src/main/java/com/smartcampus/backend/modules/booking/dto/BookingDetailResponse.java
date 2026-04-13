package com.smartcampus.backend.modules.booking.dto;

import com.smartcampus.backend.common.enums.BookingStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record BookingDetailResponse(
        Long id,
        Long resourceId,
        String resourceCode,
        String resourceName,
        Long locationId,
        String locationName,
        Long requesterUserId,
        String requesterEmail,
        String requesterDisplayName,
        LocalDate bookingDate,
        LocalTime startTime,
        LocalTime endTime,
        String purpose,
        Integer expectedAttendees,
        String requestNotes,
        BookingStatus status,
        Long reviewedByUserId,
        String reviewedByDisplayName,
        LocalDateTime reviewedAt,
        String reviewReason,
        Long cancelledByUserId,
        String cancelledByDisplayName,
        LocalDateTime cancelledAt,
        String cancellationReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {}
