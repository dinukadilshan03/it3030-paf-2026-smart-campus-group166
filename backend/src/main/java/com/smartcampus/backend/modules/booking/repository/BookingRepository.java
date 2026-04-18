package com.smartcampus.backend.modules.booking.repository;

import com.smartcampus.backend.common.enums.BookingStatus;
import com.smartcampus.backend.modules.booking.entity.Booking;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Query(
            """
            select b
            from Booking b
            join fetch b.resource r
            join fetch r.location l
            join fetch b.requesterUser ru
            left join fetch b.reviewedByUser rvu
            left join fetch b.cancelledByUser cu
            where b.id = :id
            """)
    Optional<Booking> findDetailedById(@Param("id") Long id);

    @Query(
            """
            select b
            from Booking b
            join fetch b.resource r
            join fetch b.requesterUser ru
            where ru.id = :requesterUserId
              and (:status is null or b.status = :status)
              and (:resourceId is null or r.id = :resourceId)
              and (:bookingDate is null or b.bookingDate = :bookingDate)
            order by b.bookingDate desc, b.startTime desc, b.id desc
            """)
    List<Booking> findVisibleToRequester(
            @Param("requesterUserId") Long requesterUserId,
            @Param("status") BookingStatus status,
            @Param("resourceId") Long resourceId,
            @Param("bookingDate") LocalDate bookingDate);

    @Query(
            """
            select b
            from Booking b
            join fetch b.resource r
            join fetch b.requesterUser ru
            where (:status is null or b.status = :status)
              and (:resourceId is null or r.id = :resourceId)
              and (:requesterUserId is null or ru.id = :requesterUserId)
              and (:bookingDate is null or b.bookingDate = :bookingDate)
            order by b.bookingDate desc, b.startTime desc, b.id desc
            """)
    List<Booking> searchBookingsForAdmin(
            @Param("status") BookingStatus status,
            @Param("resourceId") Long resourceId,
            @Param("requesterUserId") Long requesterUserId,
            @Param("bookingDate") LocalDate bookingDate);

    @Query(
            """
            select b
            from Booking b
            join fetch b.resource r
            join fetch r.location l
            join fetch b.requesterUser ru
            where b.bookingDate >= :startDate
              and b.bookingDate <= :endDate
            order by b.bookingDate asc, b.startTime asc, b.id asc
            """)
    List<Booking> findScheduledBetween(
            @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query(
            """
            select b
            from Booking b
            join fetch b.resource r
            join fetch r.location l
            join fetch b.requesterUser ru
            where b.createdAt >= :start
              and b.createdAt < :end
            order by b.createdAt asc, b.id asc
            """)
    List<Booking> findCreatedBetween(
            @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query(
            """
            select count(b)
            from Booking b
            where b.resource.id = :resourceId
              and b.bookingDate = :bookingDate
              and b.status not in :ignoredStatuses
              and (:excludeBookingId is null or b.id <> :excludeBookingId)
              and b.startTime < :endTime
              and b.endTime > :startTime
            """)
    long countOverlappingBookings(
            @Param("resourceId") Long resourceId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("ignoredStatuses") Collection<BookingStatus> ignoredStatuses,
            @Param("excludeBookingId") Long excludeBookingId);
}
