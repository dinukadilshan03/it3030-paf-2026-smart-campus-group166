package com.smartcampus.backend.modules.booking.mapper;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.modules.booking.dto.BookingDetailResponse;
import com.smartcampus.backend.modules.booking.dto.BookingSummaryResponse;
import com.smartcampus.backend.modules.booking.entity.Booking;
import org.springframework.stereotype.Component;

@Component
public class BookingMapper {

    public BookingSummaryResponse toSummary(Booking booking) {
        return new BookingSummaryResponse(
                booking.getId(),
                booking.getResource().getId(),
                booking.getResource().getResourceCode(),
                booking.getResource().getName(),
                booking.getRequesterUser().getId(),
                resolveDisplayName(booking.getRequesterUser()),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getStatus(),
                booking.getExpectedAttendees(),
                booking.getCreatedAt());
    }

    public BookingDetailResponse toDetail(Booking booking) {
        return new BookingDetailResponse(
                booking.getId(),
                booking.getResource().getId(),
                booking.getResource().getResourceCode(),
                booking.getResource().getName(),
                booking.getResource().getLocation().getId(),
                booking.getResource().getLocation().getName(),
                booking.getRequesterUser().getId(),
                booking.getRequesterUser().getEmail(),
                resolveDisplayName(booking.getRequesterUser()),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getPurpose(),
                booking.getExpectedAttendees(),
                booking.getRequestNotes(),
                booking.getStatus(),
                booking.getReviewedByUser() == null ? null : booking.getReviewedByUser().getId(),
                booking.getReviewedByUser() == null ? null : resolveDisplayName(booking.getReviewedByUser()),
                booking.getReviewedAt(),
                booking.getReviewReason(),
                booking.getCancelledByUser() == null ? null : booking.getCancelledByUser().getId(),
                booking.getCancelledByUser() == null
                        ? null
                        : resolveDisplayName(booking.getCancelledByUser()),
                booking.getCancelledAt(),
                booking.getCancellationReason(),
                booking.getCreatedAt(),
                booking.getUpdatedAt());
    }

    private String resolveDisplayName(User user) {
        if (user == null) {
            return null;
        }
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName();
        }
        return user.getEmail();
    }
}
