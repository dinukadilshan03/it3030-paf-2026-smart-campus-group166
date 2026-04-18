package com.smartcampus.backend.modules.ticket.repository;

import com.smartcampus.backend.modules.ticket.entity.TicketReport;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketReportRepository extends JpaRepository<TicketReport, Long> {

    @Query(
            """
            select tr
            from TicketReport tr
            join fetch tr.generatedByUser gu
            order by tr.generatedAt desc
            """)
    List<TicketReport> findAllWithUserOrderByGeneratedAtDesc();

    @Query(
            """
            select tr
            from TicketReport tr
            join fetch tr.generatedByUser gu
            where gu.id = :userId
            order by tr.generatedAt desc
            """)
    List<TicketReport> findByGeneratedByUserIdOrderByGeneratedAtDesc(@Param("userId") Long userId);

    @Query(
            """
            select tr
            from TicketReport tr
            join fetch tr.generatedByUser gu
            where tr.id = :id
            """)
    Optional<TicketReport> findDetailedById(@Param("id") Long id);
}
