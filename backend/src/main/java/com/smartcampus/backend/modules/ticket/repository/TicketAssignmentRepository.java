//A Spring Data JPA repository for managing ticket assignments.
package com.smartcampus.backend.modules.ticket.repository;

import com.smartcampus.backend.modules.ticket.entity.TicketAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketAssignmentRepository extends JpaRepository<TicketAssignment, Long> {

    @Query("SELECT ta FROM TicketAssignment ta WHERE ta.ticket.id = :ticketId")
    List<TicketAssignment> findByTicketId(@Param("ticketId") Long ticketId);

    @Query("SELECT ta FROM TicketAssignment ta WHERE ta.technician.userId = :technicianId")
    List<TicketAssignment> findByTechnicianId(@Param("technicianId") Long technicianId);
}
