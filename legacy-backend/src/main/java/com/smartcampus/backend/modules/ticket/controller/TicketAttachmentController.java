package com.smartcampus.backend.modules.ticket.controller;

import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentCreateDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentResponseDTO;
import com.smartcampus.backend.modules.ticket.service.TicketAttachmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tickets/{ticketId}/attachments")
public class TicketAttachmentController {

    private final TicketAttachmentService ticketAttachmentService;

    public TicketAttachmentController(TicketAttachmentService ticketAttachmentService) {
        this.ticketAttachmentService = ticketAttachmentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketAttachmentResponseDTO addAttachment(
            @PathVariable Long ticketId,
            @Valid @RequestBody TicketAttachmentCreateDTO attachmentDTO
    ) {
        return ticketAttachmentService.addAttachment(ticketId, attachmentDTO);
    }

    @GetMapping
    public List<TicketAttachmentResponseDTO> getAttachmentsByTicket(@PathVariable Long ticketId) {
        return ticketAttachmentService.getAttachmentsByTicket(ticketId);
    }

    @DeleteMapping("/{attachmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAttachment(@PathVariable Long ticketId, @PathVariable Long attachmentId) {
        ticketAttachmentService.deleteAttachment(ticketId, attachmentId);
    }
}
