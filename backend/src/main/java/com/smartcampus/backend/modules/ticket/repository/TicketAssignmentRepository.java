package com.smartcampus.backend.modules.ticket.repository;

// Imports the TicketAssignment entity that this repository manages
import com.smartcampus.backend.modules.ticket.entity.TicketAssignment;

import java.util.List;
import java.util.Optional;

// JpaRepository gives built-in CRUD operations such as save, findById, deleteById, findAll
import org.springframework.data.jpa.repository.JpaRepository;

// Used to write custom JPQL queries
import org.springframework.data.jpa.repository.Query;

// Used to bind method parameters into JPQL query parameters
import org.springframework.data.repository.query.Param;

// Repository interface for TicketAssignment entity
// Extends JpaRepository<TicketAssignment, Long> which means:
// - entity type = TicketAssignment
// - primary key type = Long
public interface TicketAssignmentRepository extends JpaRepository<TicketAssignment, Long> {

    // Custom query to get all assignment history records for a specific ticket
    //
    // Query explanation:
    // - select ta from TicketAssignment ta
    //   selects assignment records
    //
    // - join fetch ta.assignedToUser atu
    //   eagerly fetches the assignedToUser entity in the same query
    //
    // - join fetch ta.assignedByUser abu
    //   eagerly fetches the assignedByUser entity in the same query
    //
    // - where ta.ticket.id = :ticketId
    //   filters records belonging to the given ticket ID
    //
    // - order by ta.assignedAt desc
    //   sorts assignment history so the newest assignment appears first
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

    // Custom query to get the currently active assignment for a specific ticket
    //
    // Query explanation:
    // - select ta from TicketAssignment ta
    //   selects assignment records
    //
    // - join fetch ta.assignedToUser atu
    //   fetches assigned staff user in the same query
    //
    // - join fetch ta.assignedByUser abu
    //   fetches the assigner user in the same query
    //
    // - where ta.ticket.id = :ticketId
    //   filters by the given ticket
    //
    // - and ta.isActive = true
    //   returns only the current active assignment
    //
    // Optional<TicketAssignment> is used because:
    // - a ticket may or may not have an active assignment
    // - Optional safely represents that the result may be absent
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