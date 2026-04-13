package com.smartcampus.backend.modules.ticket.controller;

import com.smartcampus.backend.modules.ticket.dto.CreateTicketAttachmentRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentResponse;
import com.smartcampus.backend.modules.ticket.service.TicketAttachmentService;
import com.smartcampus.backend.modules.ticket.service.TicketService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tickets/{ticketId}/attachments")
@RequiredArgsConstructor
public class TicketAttachmentController {

    private final TicketService ticketService;
    private final TicketAttachmentService ticketAttachmentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public List<TicketAttachmentResponse> getAttachments(@PathVariable Long ticketId) {
        return ticketAttachmentService.getAttachments(ticketService.getDetailedTicketEntity(ticketId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public TicketAttachmentResponse addAttachment(
            @PathVariable Long ticketId,
            @Valid @RequestBody CreateTicketAttachmentRequest request) {
        return ticketAttachmentService.addAttachment(
                ticketService.getManagedTicketEntity(ticketId), request);
    }

    @DeleteMapping("/{attachmentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAttachment(@PathVariable Long ticketId, @PathVariable Long attachmentId) {
        ticketAttachmentService.deleteAttachment(
                ticketId, attachmentId, ticketService.getManagedTicketEntity(ticketId));
    }
}
