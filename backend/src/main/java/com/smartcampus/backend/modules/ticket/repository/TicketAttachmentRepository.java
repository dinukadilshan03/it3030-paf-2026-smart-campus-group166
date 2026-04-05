//A Spring Data JPA repository for managing ticket attachments.
package com.smartcampus.backend.modules.ticket.repository;

import com.smartcampus.backend.modules.ticket.entity.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {

    @Query("SELECT ta FROM TicketAttachment ta WHERE ta.ticket.id = :ticketId ORDER BY ta.uploadedAt ASC")
    List<TicketAttachment> findByTicketIdOrderByUploadedAtAsc(@Param("ticketId") Long ticketId);

    long countByTicketId(Long ticketId);
}
