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

    @Autowired
    private BookingRepository bookingRepository;

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
        List<PopularResourceDTO> popular = getPopularResources(null, Math.max(10, limit));

        if (userId == null) {
            return popular.subList(0, Math.min(limit, popular.size()));
        }

        List<Booking> userBookings = bookingRepository.findByUserId(userId);
        Set<Long> userResourceIds = new HashSet<>();
        for (Booking b : userBookings) {
            if (b.getResource() != null && b.getResource().getId() != null) {
                userResourceIds.add(b.getResource().getId());
            }
        }

        List<PopularResourceDTO> prioritized = new ArrayList<>();
        // first add user's resources if present in popular list
        for (PopularResourceDTO p : popular) {
            if (userResourceIds.contains(p.getResourceId())) {
                prioritized.add(p);
            }
        }
        // then add remaining popular
        for (PopularResourceDTO p : popular) {
            if (!userResourceIds.contains(p.getResourceId())) {
                prioritized.add(p);
            }
        }

        return prioritized.subList(0, Math.min(limit, prioritized.size()));
    }
}
