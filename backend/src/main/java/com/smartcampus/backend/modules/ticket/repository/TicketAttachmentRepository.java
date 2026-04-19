package com.smartcampus.backend.modules.ticket.repository;

// Imports the TicketAttachment entity that this repository manages
import com.smartcampus.backend.modules.ticket.entity.TicketAttachment;

import java.util.List;
import java.util.Optional;

// JpaRepository provides built-in CRUD methods such as save, findById, findAll, deleteById
import org.springframework.data.jpa.repository.JpaRepository;

// Used to define custom JPQL queries
import org.springframework.data.jpa.repository.Query;

// Used to bind method parameters into named query parameters
import org.springframework.data.repository.query.Param;

// Repository interface for TicketAttachment entity
// Extends JpaRepository<TicketAttachment, Long> where:
// - entity type = TicketAttachment
// - primary key type = Long
public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {

    // Custom query to fetch all attachments belonging to a specific ticket
    //
    // Query explanation:
    // - select ta from TicketAttachment ta
    //   selects attachment records
    //
    // - join fetch ta.uploadedByUser uu
    //   eagerly fetches the uploader user in the same query
    //
    // - where ta.ticket.id = :ticketId
    //   filters attachments belonging to the given ticket
    //
    // - order by ta.createdAt asc
    //   sorts attachments from oldest to newest
    @Query(
            """
            select ta
            from TicketAttachment ta
            join fetch ta.uploadedByUser uu
            where ta.ticket.id = :ticketId
            order by ta.createdAt asc
            """)
    List<TicketAttachment> findByTicketIdOrderByCreatedAtAsc(@Param("ticketId") Long ticketId);

    // Derived query method provided by Spring Data JPA
    //
    // Purpose:
    // - counts how many attachments currently belong to a given ticket
    //
    // Why ticketId is used:
    // - because attachments are linked to a parent ticket
    //
    // Why this is useful:
    // - can be used to enforce business rules such as max attachment count
    long countByTicket_Id(Long ticketId);

    // Custom query to fetch one specific attachment by:
    // - attachment ID
    // - parent ticket ID
    //
    // Query explanation:
    // - select ta from TicketAttachment ta
    //   selects the attachment record
    //
    // - join fetch ta.uploadedByUser uu
    //   eagerly fetches uploader details in the same query
    //
    // - where ta.id = :attachmentId
    //   selects the exact attachment
    //
    // - and ta.ticket.id = :ticketId
    //   ensures the attachment belongs to the specified ticket
    //
    // Optional<TicketAttachment> is used because:
    // - the attachment may not exist
    // - or it may not belong to that ticket
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