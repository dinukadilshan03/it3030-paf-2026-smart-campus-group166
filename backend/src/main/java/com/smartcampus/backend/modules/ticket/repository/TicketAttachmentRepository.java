package com.smartcampus.backend.modules.ticket.repository;

import com.smartcampus.backend.modules.ticket.entity.TicketAttachment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {

    @Query(
            """
            select ta
            from TicketAttachment ta
            join fetch ta.uploadedByUser uu
            where ta.ticket.id = :ticketId
            order by ta.createdAt asc
            """)
    List<TicketAttachment> findByTicketIdOrderByCreatedAtAsc(@Param("ticketId") Long ticketId);

    long countByTicket_Id(Long ticketId);

    @Query(
            """
            select ta
            from TicketAttachment ta
            join fetch ta.uploadedByUser uu
            where ta.id = :attachmentId
              and ta.ticket.id = :ticketId
            """)
    Optional<TicketAttachment> findByIdAndTicketId(
            @Param("attachmentId") Long attachmentId, @Param("ticketId") Long ticketId);
}
