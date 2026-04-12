package com.smartcampus.backend.modules.ticket.controller;

import com.smartcampus.backend.modules.ticket.dto.TicketCommentCreateDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketCommentResponseDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketCommentUpdateDTO;
import com.smartcampus.backend.modules.ticket.service.TicketCommentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tickets/{ticketId}/comments")
public class TicketCommentController {

    private final TicketCommentService ticketCommentService;

    public TicketCommentController(TicketCommentService ticketCommentService) {
        this.ticketCommentService = ticketCommentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketCommentResponseDTO addComment(
            @PathVariable Long ticketId,
            @Valid @RequestBody TicketCommentCreateDTO commentDTO
    ) {
        return ticketCommentService.addComment(ticketId, commentDTO);
    }

    @PutMapping("/{commentId}")
    public TicketCommentResponseDTO updateComment(
            @PathVariable Long ticketId,
            @PathVariable Long commentId,
            @Valid @RequestBody TicketCommentUpdateDTO updateDTO
    ) {
        return ticketCommentService.updateComment(ticketId, commentId, updateDTO);
    }

    @GetMapping
    public List<TicketCommentResponseDTO> getCommentsByTicket(@PathVariable Long ticketId) {
        return ticketCommentService.getCommentsByTicket(ticketId);
    }

    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(@PathVariable Long ticketId, @PathVariable Long commentId) {
        ticketCommentService.deleteComment(ticketId, commentId);
    }
}
