//Handles the business logic for ticket comments.
package com.smartcampus.backend.modules.ticket.service;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.modules.ticket.dto.TicketCommentCreateDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketCommentUpdateDTO;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketComment;
import com.smartcampus.backend.modules.ticket.repository.TicketCommentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TicketCommentService {

    @Autowired
    private TicketCommentRepository ticketCommentRepository;

    @Autowired
    private TicketService ticketService;

    /**
     * Add a comment to a ticket
     */
    public TicketComment addComment(TicketCommentCreateDTO commentDTO) {
        validateCommentCreateRequest(commentDTO);

        TicketComment comment = new TicketComment();

        Ticket ticket = ticketService.getTicketById(commentDTO.getTicketId());
        comment.setTicket(ticket);

        User user = new User();
        user.setUserId(commentDTO.getUserId());
        comment.setUser(user);

        comment.setContent(commentDTO.getContent());

        return ticketCommentRepository.save(comment);
    }

    /**
     * Update an existing comment
     */
    public TicketComment updateComment(Long id, TicketCommentUpdateDTO updateDTO) {
        Optional<TicketComment> existingComment = ticketCommentRepository.findById(id);

        if (existingComment.isEmpty()) {
            throw new RuntimeException("Ticket comment not found with id: " + id);
        }

        TicketComment comment = existingComment.get();

        if (updateDTO.getContent() != null && !updateDTO.getContent().isBlank()) {
            comment.setContent(updateDTO.getContent());
        }

        return ticketCommentRepository.save(comment);
    }

    /**
     * Get comments for a ticket
     */
    public List<TicketComment> getCommentsByTicket(Long ticketId) {
        return ticketCommentRepository.findByTicketId(ticketId);
    }

    /**
     * Delete a comment
     */
    public void deleteComment(Long id) {
        if (!ticketCommentRepository.existsById(id)) {
            throw new RuntimeException("Ticket comment not found with id: " + id);
        }

        ticketCommentRepository.deleteById(id);
    }

    private void validateCommentCreateRequest(TicketCommentCreateDTO commentDTO) {
        if (commentDTO.getTicketId() == null) {
            throw new RuntimeException("Ticket ID is required");
        }

        if (commentDTO.getUserId() == null) {
            throw new RuntimeException("User ID is required");
        }

        if (commentDTO.getContent() == null || commentDTO.getContent().isBlank()) {
            throw new RuntimeException("Comment content is required");
        }
    }
}
