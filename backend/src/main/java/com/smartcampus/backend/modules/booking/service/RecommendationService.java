package com.smartcampus.backend.modules.booking.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.smartcampus.backend.modules.booking.dto.PopularResourceDTO;
import com.smartcampus.backend.modules.booking.entity.Booking;
import com.smartcampus.backend.modules.booking.repository.BookingRepository;

@Service
public class RecommendationService {

    private final BookingRepository bookingRepository;

    public RecommendationService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    /**
     * Return top popular resources since an optional date.
     */
    public List<PopularResourceDTO> getPopularResources(LocalDateTime since, int limit) {
        List<Object[]> rows = bookingRepository.findTopResources(since, PageRequest.of(0, Math.max(1, limit)));
        List<PopularResourceDTO> result = new ArrayList<>();
        for (Object[] r : rows) {
            Long resourceId = r[0] == null ? null : ((Number) r[0]).longValue();
            String resourceName = r[1] == null ? null : r[1].toString();
            Long usageCount = r[2] == null ? 0L : ((Number) r[2]).longValue();
            result.add(new PopularResourceDTO(resourceId, resourceName, usageCount));
        }
        return result;
    }

    /**
     * Simple recommendation: prioritizes resources the user has booked before,
     * falling back to popularity ranking.
     */
    public List<PopularResourceDTO> getRecommendations(Long userId, int limit) {
        return getRecommendations(userId, null, null, limit);
    }

    /**
     * Recommend resources with optional time window availability filtering.
     * If startTime and endTime are provided, resources that have APPROVED
     * bookings overlapping that range are excluded.
     */
    public List<PopularResourceDTO> getRecommendations(Long userId, java.time.LocalDateTime startTime,
                                                       java.time.LocalDateTime endTime, int limit) {
        List<PopularResourceDTO> popular = getPopularResources(null, Math.max(10, limit));

        Set<Long> userResourceIds = new HashSet<>();
        if (userId != null) {
            List<Booking> userBookings = bookingRepository.findByUser_UserId(userId);
            for (Booking b : userBookings) {
                if (b.getResource() != null && b.getResource().getId() != null) {
                    userResourceIds.add(b.getResource().getId());
                }
            }
        }

        List<PopularResourceDTO> filtered = new ArrayList<>();

        for (PopularResourceDTO p : popular) {
            Long resId = p.getResourceId();

            // If time window provided, check for conflicting APPROVED bookings
            boolean available = true;
            if (startTime != null && endTime != null && resId != null) {
                List<Booking> conflicts = bookingRepository.findByResourceIdAndStatusAndTimeRange(resId,
                        "APPROVED", startTime, endTime);
                if (conflicts != null && !conflicts.isEmpty()) {
                    available = false;
                }
            }

            if (available) filtered.add(p);
        }

        // Prioritize user's previous resources
        List<PopularResourceDTO> prioritized = new ArrayList<>();
        for (PopularResourceDTO p : filtered) {
            if (userResourceIds.contains(p.getResourceId())) prioritized.add(p);
        }
        for (PopularResourceDTO p : filtered) {
            if (!userResourceIds.contains(p.getResourceId())) prioritized.add(p);
        }

        return prioritized.subList(0, Math.min(limit, prioritized.size()));
    }
}
