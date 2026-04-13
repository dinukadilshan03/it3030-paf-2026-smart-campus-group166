package com.smartcampus.backend.modules.ticket.repository;

import com.smartcampus.backend.modules.ticket.entity.TicketComment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {

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

    @Query(
            """
            select tc
            from TicketComment tc
            where tc.id = :commentId
              and tc.ticket.id = :ticketId
            """)
    Optional<TicketComment> findByIdAndTicketId(
            @Param("commentId") Long commentId, @Param("ticketId") Long ticketId);
}
