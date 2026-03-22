package com.smartcampus.backend.modules.booking.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.smartcampus.backend.modules.booking.entity.Booking;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    List<Booking> findByUserId(Long userId);
    
    List<Booking> findByResourceId(Long resourceId);
    
    List<Booking> findByResourceIdAndStatus(Long resourceId, String status);
    
    /**
     * Find bookings that conflict with a given time range for a specific resource
     */
    @Query("SELECT b FROM Booking b WHERE b.resource.id = :resourceId " +
           "AND b.status = :status " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findByResourceIdAndStatusAndTimeRange(
            @Param("resourceId") Long resourceId,
            @Param("status") String status,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
    
    /**
     * Find all pending bookings for approval
     */
    List<Booking> findByStatus(String status);
    
    /**
     * Find bookings created after a specific date
     */
    List<Booking> findByCreatedAtAfter(LocalDateTime createdAt);
}