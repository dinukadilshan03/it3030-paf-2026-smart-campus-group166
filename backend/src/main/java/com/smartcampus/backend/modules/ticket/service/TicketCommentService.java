package com.smartcampus.backend.modules.ticket.service;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.CommentType;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.modules.ticket.dto.CreateTicketCommentRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketCommentResponse;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketComment;
import com.smartcampus.backend.modules.ticket.mapper.TicketMapper;
import com.smartcampus.backend.modules.ticket.repository.TicketCommentRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TicketCommentService {

    private final TicketCommentRepository ticketCommentRepository;
    private final TicketAccessService ticketAccessService;
    private final TicketMapper ticketMapper;

    @Transactional(readOnly = true)
    public List<TicketCommentResponse> getComments(Ticket ticket) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        ticketAccessService.ensureCanViewTicket(membership, ticket);

        return ticketCommentRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId()).stream()
                .filter(
                        comment ->
                                comment.getCommentType() != CommentType.INTERNAL_NOTE
                                        || canSeeInternalNotes(membership, ticket))
                .map(ticketMapper::toCommentResponse)
                .toList();
    }

    @Transactional
    public TicketCommentResponse addComment(Ticket ticket, CreateTicketCommentRequest request) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        if (request.commentType() == CommentType.STATUS_NOTE) {
            throw new IllegalArgumentException("Status notes are system-generated and cannot be created manually");
        }

        if (request.commentType() == CommentType.INTERNAL_NOTE) {
            ticketAccessService.ensureCanAddInternalNote(membership, ticket);
        } else {
            ticketAccessService.ensureCanAddPublicComment(membership, ticket);
        }

        TicketComment parentComment = null;
        if (request.parentCommentId() != null) {
            parentComment =
                    ticketCommentRepository
                            .findByIdAndTicketId(request.parentCommentId(), ticket.getId())
                            .orElseThrow(
                                    () ->
                                            new ResourceNotFoundException(
                                                    "Parent comment not found for ticket id: "
                                                            + ticket.getId()));
        }

        TicketComment comment =
                TicketComment.builder()
                        .ticket(ticket)
                        .authorUser(membership.getUser())
                        .body(request.body().trim())
                        .commentType(request.commentType())
                        .parentComment(parentComment)
                        .build();

        return ticketMapper.toCommentResponse(ticketCommentRepository.save(comment));
    }

    @Transactional
    public TicketComment createSystemStatusNote(Ticket ticket, String body, User actor) {
        TicketComment comment =
                TicketComment.builder()
                        .ticket(ticket)
                        .authorUser(actor)
                        .body(body)
                        .commentType(CommentType.STATUS_NOTE)
                        .build();
        return ticketCommentRepository.save(comment);
    }

    private boolean canSeeInternalNotes(UserRole membership, Ticket ticket) {
        return membership.getRole().getCode() == RoleCode.ADMIN
                || (membership.getRole().getCode() == RoleCode.STAFF
                        && ticket.getAssignedStaffUser() != null
                        && ticket.getAssignedStaffUser().getId().equals(membership.getUser().getId()));
    }
}
