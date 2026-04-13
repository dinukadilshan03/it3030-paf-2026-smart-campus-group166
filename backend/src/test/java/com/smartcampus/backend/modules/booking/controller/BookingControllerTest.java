package com.smartcampus.backend.modules.booking.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.common.enums.BookingStatus;
import com.smartcampus.backend.modules.booking.dto.BookingDetailResponse;
import com.smartcampus.backend.modules.booking.dto.BookingSummaryResponse;
import com.smartcampus.backend.modules.booking.dto.CreateBookingRequest;
import com.smartcampus.backend.modules.booking.service.BookingService;
import java.lang.reflect.Method;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.prepost.PreAuthorize;

@ExtendWith(MockitoExtension.class)
class BookingControllerTest {

    @Mock private BookingService bookingService;

    @InjectMocks private BookingController bookingController;

    @Test
    void createBookingIsRestrictedToStudentsAndAdmins() throws NoSuchMethodException {
        Method method =
                BookingController.class.getDeclaredMethod("createBooking", CreateBookingRequest.class);
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);

        assertThat(annotation).isNotNull();
        assertThat(annotation.value()).isEqualTo("hasAnyRole('STUDENT', 'ADMIN')");
    }

    @Test
    void reviewBookingIsRestrictedToAdmins() throws NoSuchMethodException {
        Method method =
                BookingController.class.getDeclaredMethod(
                        "reviewBooking",
                        Long.class,
                        com.smartcampus.backend.modules.booking.dto.ReviewBookingRequest.class);
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);

        assertThat(annotation).isNotNull();
        assertThat(annotation.value()).isEqualTo("hasRole('ADMIN')");
    }

    @Test
    void returnsBookingsFromService() {
        BookingSummaryResponse summary =
                new BookingSummaryResponse(
                        1L,
                        10L,
                        "LAB-01",
                        "Lab 1",
                        2L,
                        "Student User",
                        LocalDate.now().plusDays(1),
                        LocalTime.of(9, 0),
                        LocalTime.of(10, 0),
                        BookingStatus.PENDING,
                        4,
                        LocalDateTime.now());
        when(bookingService.getBookings(BookingStatus.PENDING, 10L, null, null))
                .thenReturn(List.of(summary));

        List<BookingSummaryResponse> responses =
                bookingController.getBookings(BookingStatus.PENDING, 10L, null, null);

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().resourceCode()).isEqualTo("LAB-01");
    }

    @Test
    void returnsBookingDetailFromService() {
        BookingDetailResponse detail =
                new BookingDetailResponse(
                        2L,
                        10L,
                        "LAB-02",
                        "Lab 2",
                        20L,
                        "Building A",
                        3L,
                        "student@example.com",
                        "Student",
                        LocalDate.now().plusDays(1),
                        LocalTime.of(11, 0),
                        LocalTime.of(12, 0),
                        "Workshop",
                        20,
                        null,
                        BookingStatus.APPROVED,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        LocalDateTime.now(),
                        LocalDateTime.now());
        when(bookingService.getBookingById(2L)).thenReturn(detail);

        BookingDetailResponse response = bookingController.getBookingById(2L);

        assertThat(response.status()).isEqualTo(BookingStatus.APPROVED);
        assertThat(response.resourceName()).isEqualTo("Lab 2");
    }
}
