package com.smartcampus.backend.modules.ticket.service;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.CommentType;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.exception.ResourceConflictException;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.modules.notification.service.NotificationService;
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

    // Repository for persisting and fetching ticket comments
    private final TicketCommentRepository ticketCommentRepository;

    // Handles permission and membership checks for ticket operations
    private final TicketAccessService ticketAccessService;

    // Updates SLA-related timestamps when staff/admin respond
    private final TicketSlaService ticketSlaService;

    // Maps entity objects to API response DTOs
    private final TicketMapper ticketMapper;

    // Sends notifications when comments are added
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<TicketCommentResponse> getComments(Ticket ticket) {
        // Get the current user's membership in the system
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();

        // Ensure the current user is allowed to view this ticket
        ticketAccessService.ensureCanViewTicket(membership, ticket);

        // Fetch all comments in chronological order
        // Hide internal notes unless the current user is allowed to see them
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
        // Get the current user's membership
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();

        // Prevent manual creation of system-generated status notes
        if (request.commentType() == CommentType.STATUS_NOTE) {
            throw new IllegalArgumentException("Status notes are system-generated and cannot be created manually");
        }

        // Check permission based on comment type
        if (request.commentType() == CommentType.INTERNAL_NOTE) {
            ticketAccessService.ensureCanAddInternalNote(membership, ticket);
        } else {
            ticketAccessService.ensureCanAddPublicComment(membership, ticket);
        }

        // If this is a reply, fetch the parent comment and ensure it belongs to the same ticket
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

        // Build the new comment entity
        TicketComment comment =
                TicketComment.builder()
                        .ticket(ticket)
                        .authorUser(membership.getUser())
                        .body(request.body().trim())
                        .commentType(request.commentType())
                        .parentComment(parentComment)
                        .build();

        // Save the comment
        TicketComment savedComment = ticketCommentRepository.save(comment);

        // Mark first response for SLA only if responder is not a student
        if (membership.getRole().getCode() != RoleCode.STUDENT) {
            ticketSlaService.markFirstResponseIfNeeded(ticket.getId());
        }

        // Notify relevant users about the new comment
        notificationService.notifyTicketCommentAdded(ticket, savedComment);

        // Convert entity to response DTO
        return ticketMapper.toCommentResponse(savedComment);
    }

    @Transactional
    public TicketCommentResponse updateComment(
            Ticket ticket, Long commentId, UpdateTicketCommentRequest request) {
        // Get current user membership
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();

        // Load the target comment
        TicketComment comment = getComment(ticket.getId(), commentId);

        // Ensure user is allowed to edit this comment
        ensureCanManageComment(membership, ticket, comment);

        // Ensure this comment type is editable
        ensureCommentCanBeMutated(comment);

        // Update the comment body and edit metadata
        comment.setBody(request.body().trim());
        comment.setIsEdited(true);
        comment.setEditedAt(LocalDateTime.now());

        // Save and return updated comment response
        return ticketMapper.toCommentResponse(ticketCommentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Ticket ticket, Long commentId) {
        // Get current user membership
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();

        // Load the target comment
        TicketComment comment = getComment(ticket.getId(), commentId);

        // Ensure user is allowed to delete this comment
        ensureCanManageComment(membership, ticket, comment);

        // Ensure this comment type is deletable
        ensureCommentCanBeMutated(comment);

        // Prevent deletion if the comment has replies
        if (ticketCommentRepository.existsByParentComment_Id(commentId)) {
            throw new ResourceConflictException("Comments with replies cannot be deleted");
        }

        // Delete the comment
        ticketCommentRepository.delete(comment);
    }

    @Transactional
    public TicketComment createSystemStatusNote(Ticket ticket, String body, User actor) {
        // Create a system-generated status note for ticket activity tracking
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
        // Admins can always see internal notes
        // Staff can only see internal notes if they are assigned to the ticket
        return membership.getRole().getCode() == RoleCode.ADMIN
                || (membership.getRole().getCode() == RoleCode.STAFF
                        && ticket.getAssignedStaffUser() != null
                        && ticket.getAssignedStaffUser().getId().equals(membership.getUser().getId()));
    }

    private TicketComment getComment(Long ticketId, Long commentId) {
        // Fetch a comment by ID and ticket ID, or fail if not found
        return ticketCommentRepository
                .findByIdAndTicketId(commentId, ticketId)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Comment not found for ticket id: " + ticketId));
    }

    private void ensureCanManageComment(UserRole membership, Ticket ticket, TicketComment comment) {
        // User must at least be able to view the ticket
        ticketAccessService.ensureCanViewTicket(membership, ticket);

        // Admin can manage any comment
        if (membership.getRole().getCode() == RoleCode.ADMIN) {
            return;
        }

        // Comment author can manage their own comment
        if (comment.getAuthorUser().getId().equals(membership.getUser().getId())) {
            return;
        }

        // Otherwise deny access
        throw new AccessDeniedException("You do not have permission to manage this comment");
    }

    private void ensureCommentCanBeMutated(TicketComment comment) {
        // System-generated status notes cannot be edited or deleted
        if (comment.getCommentType() == CommentType.STATUS_NOTE) {
            throw new IllegalArgumentException("System status notes cannot be edited or deleted");
        }
    }
}