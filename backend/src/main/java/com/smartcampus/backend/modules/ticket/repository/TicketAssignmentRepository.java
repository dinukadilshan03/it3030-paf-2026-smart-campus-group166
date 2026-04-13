package com.smartcampus.backend.modules.ticket.repository;

import com.smartcampus.backend.modules.ticket.entity.TicketAssignment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketAssignmentRepository extends JpaRepository<TicketAssignment, Long> {

    @Query(
            """
            select ta
            from TicketAssignment ta
            join fetch ta.assignedToUser atu
            join fetch ta.assignedByUser abu
            where ta.ticket.id = :ticketId
            order by ta.assignedAt desc
            """)
    List<TicketAssignment> findByTicketIdOrderByAssignedAtDesc(@Param("ticketId") Long ticketId);

    @Query(
            """
            select ta
            from TicketAssignment ta
            join fetch ta.assignedToUser atu
            join fetch ta.assignedByUser abu
            where ta.ticket.id = :ticketId
              and ta.isActive = true
            """)
    Optional<TicketAssignment> findActiveByTicketId(@Param("ticketId") Long ticketId);
}
