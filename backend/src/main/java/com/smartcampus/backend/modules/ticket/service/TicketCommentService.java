package com.smartcampus.backend.modules.ticket.service;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.modules.auth.service.CurrentUserService;
import com.smartcampus.backend.modules.ticket.dto.TicketCommentCreateDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketCommentResponseDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketCommentUpdateDTO;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketComment;
import com.smartcampus.backend.modules.ticket.mapper.TicketMapper;
import com.smartcampus.backend.modules.ticket.repository.TicketCommentRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TicketCommentService {

    private final TicketCommentRepository ticketCommentRepository;
    private final TicketService ticketService;
    private final CurrentUserService currentUserService;

    public TicketCommentService(
            TicketCommentRepository ticketCommentRepository,
            TicketService ticketService,
            CurrentUserService currentUserService
    ) {
        this.ticketCommentRepository = ticketCommentRepository;
        this.ticketService = ticketService;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public TicketCommentResponseDTO addComment(Long ticketId, TicketCommentCreateDTO commentDTO) {
        Ticket ticket = ticketService.getTicketEntity(ticketId);
        User user = currentUserService.getCurrentUser();

        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setUser(user);
        comment.setContent(commentDTO.getContent().trim());

        return TicketMapper.toCommentResponse(ticketCommentRepository.save(comment));
    }

    @Transactional
    public TicketCommentResponseDTO updateComment(Long ticketId, Long commentId, TicketCommentUpdateDTO updateDTO) {
        TicketComment comment = getComment(ticketId, commentId);
        validateCommentOwnership(comment);
        comment.setContent(updateDTO.getContent().trim());
        return TicketMapper.toCommentResponse(ticketCommentRepository.save(comment));
    }

    @Transactional(readOnly = true)
    public List<TicketCommentResponseDTO> getCommentsByTicket(Long ticketId) {
        ticketService.getTicketEntity(ticketId);
        return ticketCommentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(TicketMapper::toCommentResponse)
                .toList();
    }

    @Transactional
    public void deleteComment(Long ticketId, Long commentId) {
        TicketComment comment = getComment(ticketId, commentId);
        validateCommentOwnership(comment);
        ticketCommentRepository.delete(comment);
    }

    private TicketComment getComment(Long ticketId, Long commentId) {
        TicketComment comment = ticketCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket comment not found with id: " + commentId));
        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new IllegalArgumentException("Comment does not belong to the selected ticket");
        }

        return comment;
    }

    private void validateCommentOwnership(TicketComment comment) {
        User currentUser = currentUserService.getCurrentUser();
        boolean ownsComment = comment.getUser().getUserId().equals(currentUser.getUserId());

        if (!ownsComment && !currentUserService.isAdmin(currentUser)) {
            throw new AccessDeniedException("You do not have permission to manage this comment");
        }
    }
}
