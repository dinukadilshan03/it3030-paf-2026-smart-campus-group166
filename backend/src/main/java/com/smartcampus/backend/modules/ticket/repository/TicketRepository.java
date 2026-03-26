//A Spring Data JPA repository for managing Ticket entities.
package com.smartcampus.backend.modules.ticket.repository;

import com.smartcampus.backend.modules.ticket.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    @Query("SELECT t FROM Ticket t WHERE t.reportedBy.userId = :reportedById")
    List<Ticket> findByReportedById(@Param("reportedById") Long reportedById);

    @Query("SELECT t FROM Ticket t WHERE t.resource.id = :resourceId")
    List<Ticket> findByResourceId(@Param("resourceId") Long resourceId);

    List<Ticket> findByStatus(String status);

    List<Ticket> findByPriority(String priority);

    List<Ticket> findByCategory(String category);
}
