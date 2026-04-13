package com.smartcampus.backend.modules.ticket.repository;

import com.smartcampus.backend.common.enums.TicketPriority;
import com.smartcampus.backend.common.enums.TicketStatus;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    boolean existsByTicketNumber(String ticketNumber);

    boolean existsByTicketCategory_Id(Long categoryId);

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

    @Query(
            """
            select distinct t
            from Ticket t
            join fetch t.ticketCategory tc
            join fetch t.reporterUser ru
            join fetch t.assignedStaffUser asu
            left join fetch t.resource r
            left join fetch t.location l
            where asu.id = :assignedStaffUserId
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
    List<Ticket> searchForAssignedStaff(
            @Param("assignedStaffUserId") Long assignedStaffUserId,
            @Param("status") TicketStatus status,
            @Param("priority") TicketPriority priority,
            @Param("ticketCategoryId") Long ticketCategoryId,
            @Param("search") String search);
}
