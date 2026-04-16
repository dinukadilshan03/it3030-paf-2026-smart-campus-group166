package com.smartcampus.backend.modules.ticket.controller;

import com.smartcampus.backend.common.service.StoredObjectContent;
import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentResponse;
import com.smartcampus.backend.modules.ticket.service.TicketAttachmentService;
import com.smartcampus.backend.modules.ticket.service.TicketService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public TicketAttachmentResponse addAttachment(
            @PathVariable Long ticketId,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam("file") MultipartFile file) {
        return ticketAttachmentService.addAttachment(
                ticketService.getManagedTicketEntity(ticketId), title, file);
    }

    @GetMapping("/{attachmentId}/content")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public ResponseEntity<byte[]> getAttachmentContent(
            @PathVariable Long ticketId, @PathVariable Long attachmentId) {
        StoredObjectContent content =
                ticketAttachmentService.getAttachmentContent(
                        ticketId, attachmentId, ticketService.getDetailedTicketEntity(ticketId));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .contentLength(content.contentLength())
                .contentType(MediaType.parseMediaType(content.contentType()))
                .body(content.content());
    }

    @DeleteMapping("/{attachmentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAttachment(@PathVariable Long ticketId, @PathVariable Long attachmentId) {
        ticketAttachmentService.deleteAttachment(
                ticketId, attachmentId, ticketService.getManagedTicketEntity(ticketId));
    }
}
