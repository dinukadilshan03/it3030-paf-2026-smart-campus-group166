package com.smartcampus.backend.modules.booking.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import com.smartcampus.backend.modules.booking.dto.PopularResourceDTO;
import com.smartcampus.backend.modules.booking.entity.Booking;
import com.smartcampus.backend.modules.booking.repository.BookingRepository;

@ExtendWith(MockitoExtension.class)
public class RecommendationServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    private RecommendationService recommendationService;

    @BeforeEach
    void setUp() {
        recommendationService = new RecommendationService(bookingRepository);
    }

    @Test
    void returnsPopularWhenNoTimeProvided() {
        Object[] row1 = new Object[] {1L, "Room A", 5L};
        Object[] row2 = new Object[] {2L, "Room B", 3L};
        when(bookingRepository.findTopResources(null, PageRequest.of(0, 10))).thenReturn(Arrays.asList(row1, row2));

        List<PopularResourceDTO> recs = recommendationService.getRecommendations(null, null, null, 2);

        assertEquals(2, recs.size());
        assertEquals(1L, recs.get(0).getResourceId());
    }

    @Test
    void filtersOutUnavailableResourcesWithinTimeWindow() {
        Object[] row1 = new Object[] {1L, "Room A", 5L};
        Object[] row2 = new Object[] {2L, "Room B", 3L};
        when(bookingRepository.findTopResources(null, PageRequest.of(0, 10))).thenReturn(Arrays.asList(row1, row2));

        // Simulate conflict for resource 1
        Booking conflict = new Booking();
        when(bookingRepository.findByResourceIdAndStatusAndTimeRange(eq(1L), eq("APPROVED"), any(LocalDateTime.class), any(LocalDateTime.class)))
            .thenReturn(Collections.singletonList(conflict));
        when(bookingRepository.findByResourceIdAndStatusAndTimeRange(eq(2L), eq("APPROVED"), any(LocalDateTime.class), any(LocalDateTime.class)))
            .thenReturn(Collections.emptyList());

        LocalDateTime start = LocalDateTime.now().plusDays(1);
        LocalDateTime end = start.plusHours(2);

        List<PopularResourceDTO> recs = recommendationService.getRecommendations(null, start, end, 5);

        // resource 1 should be filtered out, only resource 2 remains
        assertEquals(1, recs.size());
        assertEquals(2L, recs.get(0).getResourceId());
    }
}
