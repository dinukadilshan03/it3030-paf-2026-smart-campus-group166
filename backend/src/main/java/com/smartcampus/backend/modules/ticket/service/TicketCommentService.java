package com.smartcampus.backend.modules.ticket.service;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.CommentType;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.exception.ResourceConflictException;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.modules.ticket.dto.CreateTicketCommentRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketCommentResponse;
import com.smartcampus.backend.modules.ticket.dto.UpdateTicketCommentRequest;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketComment;
import com.smartcampus.backend.modules.ticket.mapper.TicketMapper;
import com.smartcampus.backend.modules.ticket.repository.TicketCommentRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TicketCommentService {

    private final TicketCommentRepository ticketCommentRepository;
    private final TicketAccessService ticketAccessService;
    private final TicketSlaService ticketSlaService;
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

        TicketComment savedComment = ticketCommentRepository.save(comment);
        if (membership.getRole().getCode() != RoleCode.STUDENT) {
            ticketSlaService.markFirstResponseIfNeeded(ticket.getId());
        }
        return ticketMapper.toCommentResponse(savedComment);
    }

    @Transactional
    public TicketCommentResponse updateComment(
            Ticket ticket, Long commentId, UpdateTicketCommentRequest request) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        TicketComment comment = getComment(ticket.getId(), commentId);
        ensureCanManageComment(membership, ticket, comment);
        ensureCommentCanBeMutated(comment);

        comment.setBody(request.body().trim());
        comment.setIsEdited(true);
        comment.setEditedAt(LocalDateTime.now());

        return ticketMapper.toCommentResponse(ticketCommentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Ticket ticket, Long commentId) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        TicketComment comment = getComment(ticket.getId(), commentId);
        ensureCanManageComment(membership, ticket, comment);
        ensureCommentCanBeMutated(comment);

        if (ticketCommentRepository.existsByParentComment_Id(commentId)) {
            throw new ResourceConflictException("Comments with replies cannot be deleted");
        }

        ticketCommentRepository.delete(comment);
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

    private TicketComment getComment(Long ticketId, Long commentId) {
        return ticketCommentRepository
                .findByIdAndTicketId(commentId, ticketId)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Comment not found for ticket id: " + ticketId));
    }

    private void ensureCanManageComment(UserRole membership, Ticket ticket, TicketComment comment) {
        ticketAccessService.ensureCanViewTicket(membership, ticket);

        if (membership.getRole().getCode() == RoleCode.ADMIN) {
            return;
        }

        if (comment.getAuthorUser().getId().equals(membership.getUser().getId())) {
            return;
        }

        throw new AccessDeniedException("You do not have permission to manage this comment");
    }

    private void ensureCommentCanBeMutated(TicketComment comment) {
        if (comment.getCommentType() == CommentType.STATUS_NOTE) {
            throw new IllegalArgumentException("System status notes cannot be edited or deleted");
        }
    }
}
