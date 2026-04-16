package com.smartcampus.backend.modules.ticket.controller;

import com.smartcampus.backend.modules.ticket.dto.CreateTicketCommentRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketCommentResponse;
import com.smartcampus.backend.modules.ticket.dto.UpdateTicketCommentRequest;
import com.smartcampus.backend.modules.ticket.service.TicketCommentService;
import com.smartcampus.backend.modules.ticket.service.TicketService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tickets/{ticketId}/comments")
@RequiredArgsConstructor
public class TicketCommentController {

    private final TicketService ticketService;
    private final TicketCommentService ticketCommentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public List<TicketCommentResponse> getComments(@PathVariable Long ticketId) {
        return ticketCommentService.getComments(ticketService.getDetailedTicketEntity(ticketId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public TicketCommentResponse addComment(
            @PathVariable Long ticketId, @Valid @RequestBody CreateTicketCommentRequest request) {
        return ticketCommentService.addComment(ticketService.getManagedTicketEntity(ticketId), request);
    }

    @PatchMapping("/{commentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public TicketCommentResponse updateComment(
            @PathVariable Long ticketId,
            @PathVariable Long commentId,
            @Valid @RequestBody UpdateTicketCommentRequest request) {
        return ticketCommentService.updateComment(
                ticketService.getManagedTicketEntity(ticketId), commentId, request);
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(@PathVariable Long ticketId, @PathVariable Long commentId) {
        ticketCommentService.deleteComment(ticketService.getManagedTicketEntity(ticketId), commentId);
    }
}
