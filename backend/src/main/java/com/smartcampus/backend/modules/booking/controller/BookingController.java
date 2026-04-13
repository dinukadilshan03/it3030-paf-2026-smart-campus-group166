package com.smartcampus.backend.modules.booking.controller;

import com.smartcampus.backend.common.enums.BookingStatus;
import com.smartcampus.backend.modules.booking.dto.BookingDetailResponse;
import com.smartcampus.backend.modules.booking.dto.BookingSummaryResponse;
import com.smartcampus.backend.modules.booking.dto.CancelBookingRequest;
import com.smartcampus.backend.modules.booking.dto.CreateBookingRequest;
import com.smartcampus.backend.modules.booking.dto.ReviewBookingRequest;
import com.smartcampus.backend.modules.booking.service.BookingService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public List<BookingSummaryResponse> getBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) Long requesterUserId,
            @RequestParam(required = false) LocalDate bookingDate) {
        return bookingService.getBookings(status, resourceId, requesterUserId, bookingDate);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public BookingDetailResponse getBookingById(@PathVariable Long id) {
        return bookingService.getBookingById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingDetailResponse createBooking(@Valid @RequestBody CreateBookingRequest request) {
        return bookingService.create(request);
    }

    @PatchMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public BookingDetailResponse reviewBooking(
            @PathVariable Long id, @Valid @RequestBody ReviewBookingRequest request) {
        return bookingService.reviewBooking(id, request);
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public BookingDetailResponse cancelBooking(
            @PathVariable Long id, @RequestBody(required = false) CancelBookingRequest request) {
        return bookingService.cancelBooking(id, request == null ? new CancelBookingRequest(null) : request);
    }
}
