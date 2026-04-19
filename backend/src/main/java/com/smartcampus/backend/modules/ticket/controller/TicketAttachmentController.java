package com.smartcampus.backend.modules.ticket.controller;

// Used to represent the actual stored file content (bytes, content type, length)
// when returning attachment data to the client
import com.smartcampus.backend.common.service.StoredObjectContent;

// Response DTO returned when attachment metadata is sent to frontend
import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentResponse;

// Service that handles attachment-related business logic
import com.smartcampus.backend.modules.ticket.service.TicketAttachmentService;

// Service used to load and validate the parent ticket before attachment actions
import com.smartcampus.backend.modules.ticket.service.TicketService;

import java.util.List;

// Lombok annotation that generates constructor injection for final fields
import lombok.RequiredArgsConstructor;

// Used to set response headers such as Content-Disposition
import org.springframework.http.HttpHeaders;

// Used to return correct HTTP status codes like 201, 204
import org.springframework.http.HttpStatus;

// Used to set the correct MIME type of the returned file
import org.springframework.http.MediaType;

// Used when returning full HTTP responses with headers + body
import org.springframework.http.ResponseEntity;

// Used for role-based method security
import org.springframework.security.access.prepost.PreAuthorize;

// Spring MVC annotations for different HTTP methods
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

// Used to receive uploaded files from multipart/form-data requests
import org.springframework.web.multipart.MultipartFile;

@RestController // Marks this class as a REST controller and returns JSON / HTTP responses
@RequestMapping("/api/v1/tickets/{ticketId}/attachments") // Base URL for attachment APIs under a specific ticket
@RequiredArgsConstructor // Automatically creates constructor for final fields
public class TicketAttachmentController {

    // Service used to fetch and validate the parent ticket
    private final TicketService ticketService;

    // Service used for attachment-specific operations
    private final TicketAttachmentService ticketAttachmentService;

    // GET API: /api/v1/tickets/{ticketId}/attachments
    // Purpose: Get all attachments that belong to a given ticket
    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')") // Allows students, staff, and admins
    public List<TicketAttachmentResponse> getAttachments(@PathVariable Long ticketId) {
        // ticketId is taken from the URL path
        // First fetch the detailed ticket entity, then pass it to the attachment service
        return ticketAttachmentService.getAttachments(ticketService.getDetailedTicketEntity(ticketId));
    }

    // POST API: /api/v1/tickets/{ticketId}/attachments
    // Purpose: Upload and add a new attachment to a specific ticket
    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')") // Allows students, staff, and admins
    @ResponseStatus(HttpStatus.CREATED) // Returns HTTP 201 when attachment is successfully created
    public TicketAttachmentResponse addAttachment(
            @PathVariable Long ticketId, // ticket being attached to
            @RequestParam(value = "title", required = false) String title, // optional attachment title
            @RequestParam("file") MultipartFile file) { // uploaded file from multipart request

        // Uses the managed ticket entity because this operation modifies ticket-related data
        // Then sends ticket, title, and file to the service layer
        return ticketAttachmentService.addAttachment(
                ticketService.getManagedTicketEntity(ticketId), title, file);
    }

    // GET API: /api/v1/tickets/{ticketId}/attachments/{attachmentId}/content
    // Purpose: Return the actual file bytes/content so the user can view or download the attachment
    @GetMapping("/{attachmentId}/content")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')") // Allows students, staff, and admins
    public ResponseEntity<byte[]> getAttachmentContent(
            @PathVariable Long ticketId,
            @PathVariable Long attachmentId) {

        // attachmentId identifies which exact attachment to fetch
        // ticketId is also used to ensure the attachment belongs to the correct ticket
        // detailed ticket entity is used here for validation / lookup without modifying ticket state
        StoredObjectContent content =
                ticketAttachmentService.getAttachmentContent(
                        ticketId, attachmentId, ticketService.getDetailedTicketEntity(ticketId));

        // Builds a full HTTP response:
        // - Content-Disposition inline = display in browser if possible
        // - content length = file size
        // - content type = actual MIME type like image/png or application/pdf
        // - body = raw file bytes
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .contentLength(content.contentLength())
                .contentType(MediaType.parseMediaType(content.contentType()))
                .body(content.content());
    }

    // DELETE API: /api/v1/tickets/{ticketId}/attachments/{attachmentId}
    // Purpose: Delete a specific attachment from a ticket
    @DeleteMapping("/{attachmentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')") // Allows students, staff, and admins
    @ResponseStatus(HttpStatus.NO_CONTENT) // Returns HTTP 204 when delete succeeds
    public void deleteAttachment(@PathVariable Long ticketId, @PathVariable Long attachmentId) {
        // Delete is done using attachmentId because attachmentId uniquely identifies
        // the exact attachment record that must be removed
        // ticketId is also passed to ensure that the attachment belongs to that ticket
        // managed ticket entity is used because this operation changes data
        ticketAttachmentService.deleteAttachment(
                ticketId, attachmentId, ticketService.getManagedTicketEntity(ticketId));
    }
}