//Responsible for handling HTTP requests related to ticket attachments.
package com.smartcampus.backend.modules.ticket.controller;

import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentCreateDTO;
import com.smartcampus.backend.modules.ticket.entity.TicketAttachment;
import com.smartcampus.backend.modules.ticket.service.TicketAttachmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ticket-attachments")
public class TicketAttachmentController {

    @Autowired
    private TicketAttachmentService ticketAttachmentService;

    /**
     * Add/Create a new ticket attachment
     */
    @PostMapping
    public ResponseEntity<?> addAttachment(@RequestBody TicketAttachmentCreateDTO attachmentDTO) {
        try {
            TicketAttachment attachment = ticketAttachmentService.addAttachment(attachmentDTO);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Ticket attachment created successfully");
            response.put("data", attachment);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Get attachments by ticket
     */
    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<?> getAttachmentsByTicket(@PathVariable Long ticketId) {
        try {
            List<TicketAttachment> attachments = ticketAttachmentService.getAttachmentsByTicket(ticketId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", attachments);
            response.put("count", attachments.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Delete a ticket attachment
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAttachment(@PathVariable Long id) {
        try {
            ticketAttachmentService.deleteAttachment(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Ticket attachment deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
}
