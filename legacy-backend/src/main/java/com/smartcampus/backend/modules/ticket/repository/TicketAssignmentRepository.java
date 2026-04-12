//A Spring Data JPA repository for managing ticket assignments.
package com.smartcampus.backend.modules.ticket.repository;

import com.smartcampus.backend.modules.ticket.entity.TicketAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketAssignmentRepository extends JpaRepository<TicketAssignment, Long> {

    @Query("SELECT ta FROM TicketAssignment ta WHERE ta.ticket.id = :ticketId ORDER BY ta.assignedAt DESC")
    List<TicketAssignment> findByTicketIdOrderByAssignedAtDesc(@Param("ticketId") Long ticketId);

    @Query("SELECT ta FROM TicketAssignment ta WHERE ta.technician.userId = :technicianId")
    List<TicketAssignment> findByTechnicianId(@Param("technicianId") Long technicianId);

    Optional<TicketAssignment> findFirstByTicketIdOrderByAssignedAtDesc(Long ticketId);

    @Query("""
            SELECT ta
            FROM TicketAssignment ta
            WHERE ta.ticket.id IN :ticketIds
            AND ta.assignedAt = (
                SELECT MAX(other.assignedAt)
                FROM TicketAssignment other
                WHERE other.ticket.id = ta.ticket.id
            )
            """)
    List<TicketAssignment> findLatestAssignments(@Param("ticketIds") Collection<Long> ticketIds);
}
