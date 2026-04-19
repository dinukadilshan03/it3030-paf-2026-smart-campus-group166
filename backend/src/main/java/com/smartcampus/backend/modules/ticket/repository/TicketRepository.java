package com.smartcampus.backend.modules.ticket.repository;

// Enums used as optional filters in ticket search methods
import com.smartcampus.backend.common.enums.TicketPriority;
import com.smartcampus.backend.common.enums.TicketStatus;

// Ticket entity managed by this repository
import com.smartcampus.backend.modules.ticket.entity.Ticket;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

// JpaRepository gives built-in CRUD methods like save, findById, findAll, deleteById
import org.springframework.data.jpa.repository.JpaRepository;

// Used to define custom JPQL queries
import org.springframework.data.jpa.repository.Query;

// Used to bind method parameters into named JPQL parameters
import org.springframework.data.repository.query.Param;

// Repository interface for Ticket entity
// Extends JpaRepository<Ticket, Long> where:
// - entity type = Ticket
// - primary key type = Long
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // Derived query method:
    // checks whether a ticket with this ticket number already exists
    //
    // Why useful:
    // - ticketNumber is a business identifier
    // - helps prevent duplicate ticket numbers during creation
    boolean existsByTicketNumber(String ticketNumber);

    // Derived query method:
    // checks whether any ticket currently uses a given category ID
    //
    // Why useful:
    // - before deleting a category, the system can verify whether tickets still reference it
    boolean existsByTicketCategory_Id(Long categoryId);

    // Custom query to fetch one ticket by ID together with its related data
    //
    // join fetch is used to eagerly load related entities in the same query:
    // - ticketCategory
    // - reporterUser
    // - assignedStaffUser
    // - resource
    // - location
    //
    // left join fetch is used for optional relationships such as:
    // - assignedStaffUser
    // - resource
    // - location
    //
    // Optional<Ticket> is used because the ticket may or may not exist
    @Query(
            """
            select t
            from Ticket t
            join fetch t.ticketCategory tc
            join fetch t.reporterUser ru
            left join fetch t.assignedStaffUser asu
            left join fetch t.resource r
            left join fetch t.location l
            where t.id = :id
            """)
    Optional<Ticket> findDetailedById(@Param("id") Long id);

    // Custom query to fetch one ticket by ticket number, ignoring case,
    // together with related data
    //
    // lower(...) is used on both sides so the comparison is case-insensitive
    //
    // Why useful:
    // - ticketNumber is user-facing and may be searched in different letter cases
    @Query(
            """
            select t
            from Ticket t
            join fetch t.ticketCategory tc
            join fetch t.reporterUser ru
            left join fetch t.assignedStaffUser asu
            left join fetch t.resource r
            left join fetch t.location l
            where lower(t.ticketNumber) = lower(:ticketNumber)
            """)
    Optional<Ticket> findDetailedByTicketNumberIgnoreCase(
            @Param("ticketNumber") String ticketNumber);

    // Custom query to search all tickets with optional filters
    //
    // Filters supported:
    // - status
    // - priority
    // - ticket category
    // - free-text search
    //
    // Each filter is optional because of conditions like:
    // (:status is null or t.status = :status)
    //
    // Search checks:
    // - ticket number
    // - ticket title
    // - category name
    //
    // distinct is used to avoid duplicate ticket rows in case joins could multiply rows
    //
    // Ordered by newest created tickets first
    @Query(
            """
            select distinct t
            from Ticket t
            join fetch t.ticketCategory tc
            join fetch t.reporterUser ru
            left join fetch t.assignedStaffUser asu
            left join fetch t.resource r
            left join fetch t.location l
            where (:status is null or t.status = :status)
              and (:priority is null or t.priority = :priority)
              and (:ticketCategoryId is null or tc.id = :ticketCategoryId)
              and (
                :search is null
                or lower(t.ticketNumber) like concat('%', lower(:search), '%')
                or lower(t.title) like concat('%', lower(:search), '%')
                or lower(tc.name) like concat('%', lower(:search), '%')
              )
            order by t.createdAt desc
            """)
    List<Ticket> searchAll(
            @Param("status") TicketStatus status,
            @Param("priority") TicketPriority priority,
            @Param("ticketCategoryId") Long ticketCategoryId,
            @Param("search") String search);

    // Custom query to search tickets only for a specific reporter
    //
    // Main filter:
    // - ru.id = :reporterUserId
    //
    // This means the returned tickets belong only to the user who reported them
    //
    // Additional optional filters:
    // - status
    // - priority
    // - category
    // - search keyword
    @Query(
            """
            select distinct t
            from Ticket t
            join fetch t.ticketCategory tc
            join fetch t.reporterUser ru
            left join fetch t.assignedStaffUser asu
            left join fetch t.resource r
            left join fetch t.location l
            where ru.id = :reporterUserId
              and (:status is null or t.status = :status)
              and (:priority is null or t.priority = :priority)
              and (:ticketCategoryId is null or tc.id = :ticketCategoryId)
              and (
                :search is null
                or lower(t.ticketNumber) like concat('%', lower(:search), '%')
                or lower(t.title) like concat('%', lower(:search), '%')
                or lower(tc.name) like concat('%', lower(:search), '%')
              )
            order by t.createdAt desc
            """)
    List<Ticket> searchForReporter(
            @Param("reporterUserId") Long reporterUserId,
            @Param("status") TicketStatus status,
            @Param("priority") TicketPriority priority,
            @Param("ticketCategoryId") Long ticketCategoryId,
            @Param("search") String search);

    // Custom query to search tickets in staff scope
    //
    // Main condition:
    // - (asu.id = :staffUserId or ru.id = :staffUserId)
    //
    // Meaning:
    // - return tickets assigned to this staff member
    // - or tickets reported by this same user
    //
    // This supports a staff-focused view of relevant tickets
    //
    // Additional optional filters:
    // - status
    // - priority
    // - category
    // - search keyword
    @Query(
            """
            select distinct t
            from Ticket t
            join fetch t.ticketCategory tc
            join fetch t.reporterUser ru
            left join fetch t.assignedStaffUser asu
            left join fetch t.resource r
            left join fetch t.location l
            where (asu.id = :staffUserId or ru.id = :staffUserId)
              and (:status is null or t.status = :status)
              and (:priority is null or t.priority = :priority)
              and (:ticketCategoryId is null or tc.id = :ticketCategoryId)
              and (
                :search is null
                or lower(t.ticketNumber) like concat('%', lower(:search), '%')
                or lower(t.title) like concat('%', lower(:search), '%')
                or lower(tc.name) like concat('%', lower(:search), '%')
              )
            order by t.createdAt desc
            """)
    List<Ticket> searchForStaffScope(
            @Param("staffUserId") Long staffUserId,
            @Param("status") TicketStatus status,
            @Param("priority") TicketPriority priority,
            @Param("ticketCategoryId") Long ticketCategoryId,
            @Param("search") String search);

    // Custom query to fetch tickets created between two date-times
    //
    // where t.createdAt >= :start and t.createdAt < :end
    // means:
    // - include start
    // - exclude end
    //
    // This is a clean date-range pattern and avoids overlap issues
    //
    // Ordered by createdAt ascending, then id ascending
    // so results are stable and chronological
    @Query(
            """
            select distinct t
            from Ticket t
            join fetch t.ticketCategory tc
            join fetch t.reporterUser ru
            left join fetch t.assignedStaffUser asu
            left join fetch t.resource r
            left join fetch t.location l
            where t.createdAt >= :start
              and t.createdAt < :end
            order by t.createdAt asc, t.id asc
            """)
    List<Ticket> findCreatedBetween(
            @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}