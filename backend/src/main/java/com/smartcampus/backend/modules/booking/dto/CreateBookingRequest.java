package com.smartcampus.backend.modules.booking.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

public record CreateBookingRequest(
        @NotNull(message = "Resource is required") Long resourceId,
        @NotNull(message = "Booking date is required")
                @FutureOrPresent(message = "Booking date must be today or later")
                LocalDate bookingDate,
        @NotNull(message = "Start time is required") LocalTime startTime,
        @NotNull(message = "End time is required") LocalTime endTime,
        @NotBlank(message = "Purpose is required")
                @Size(max = 500, message = "Purpose must be at most 500 characters")
                String purpose,
        @Min(value = 1, message = "Expected attendees must be positive") Integer expectedAttendees,
        String requestNotes) {}
