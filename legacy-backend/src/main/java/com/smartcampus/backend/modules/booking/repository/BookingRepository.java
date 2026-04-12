//A Spring Data JPA repository for managing Booking entities. 
package com.smartcampus.backend.modules.booking.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.smartcampus.backend.modules.booking.entity.Booking;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    List<Booking> findByUser_UserId(Long userId);
    
    List<Booking> findByResource_Id(Long resourceId);
    
    List<Booking> findByResource_IdAndStatus(Long resourceId, String status);
    
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

    /**
     * Find top resources by booking count since an optional date.
     * Returns rows of [resourceId, resourceName, usageCount]
     */
    @Query("SELECT b.resource.id, b.resource.name, COUNT(b) " +
           "FROM Booking b " +
           "WHERE (:since IS NULL OR b.createdAt >= :since) " +
           "GROUP BY b.resource.id, b.resource.name " +
           "ORDER BY COUNT(b) DESC")
    List<Object[]> findTopResources(@Param("since") LocalDateTime since, Pageable pageable);
}