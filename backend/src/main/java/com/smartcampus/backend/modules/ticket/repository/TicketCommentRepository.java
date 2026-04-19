package com.smartcampus.backend.modules.ticket.repository;

// Imports the TicketComment entity that this repository manages
import com.smartcampus.backend.modules.ticket.entity.TicketComment;

import java.util.List;
import java.util.Optional;

// JpaRepository provides built-in CRUD methods such as save, findById, findAll, deleteById
import org.springframework.data.jpa.repository.JpaRepository;

// Used to define custom JPQL queries
import org.springframework.data.jpa.repository.Query;

// Used to bind method parameters into named query parameters
import org.springframework.data.repository.query.Param;

// Repository interface for TicketComment entity
// Extends JpaRepository<TicketComment, Long> where:
// - entity type = TicketComment
// - primary key type = Long
public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {

    // Custom query to fetch all comments belonging to a specific ticket
    //
    // Query explanation:
    // - select tc from TicketComment tc
    //   selects comment records
    //
    // - join fetch tc.authorUser au
    //   eagerly fetches the author user in the same query
    //
    // - left join fetch tc.parentComment pc
    //   eagerly fetches the parent comment if it exists
    //   left join is used because top-level comments may not have a parent
    //
    // - where tc.ticket.id = :ticketId
    //   filters comments belonging to the given ticket
    //
    // - order by tc.createdAt asc
    //   sorts comments from oldest to newest
    @Query(
            """
            select tc
            from TicketComment tc
            join fetch tc.authorUser au
            left join fetch tc.parentComment pc
            where tc.ticket.id = :ticketId
            order by tc.createdAt asc
            """)
    List<TicketComment> findByTicketIdOrderByCreatedAtAsc(@Param("ticketId") Long ticketId);

    // Custom query to fetch one specific comment only if it belongs to a given ticket
    //
    // Query explanation:
    // - select tc from TicketComment tc
    //   selects the comment record
    //
    // - where tc.id = :commentId
    //   identifies the exact comment
    //
    // - and tc.ticket.id = :ticketId
    //   ensures that the comment belongs to the specified ticket
    //
    // Optional<TicketComment> is used because:
    // - the comment may not exist
    // - or it may exist but not under that ticket
    @Query(
            """
            select tc
            from TicketComment tc
            where tc.id = :commentId
              and tc.ticket.id = :ticketId
            """)
    Optional<TicketComment> findByIdAndTicketId(
            @Param("commentId") Long commentId, @Param("ticketId") Long ticketId);

    // Derived query method generated automatically by Spring Data JPA
    //
    // Purpose:
    // - checks whether a given comment has any child replies
    //
    // Why parentCommentId is used:
    // - because replies store their parent comment reference
    // - if any comment exists with this parentCommentId, then the parent has replies
    //
    // Returns:
    // - true  if at least one child comment exists
    // - false if no child comments exist
    boolean existsByParentComment_Id(Long parentCommentId);
}