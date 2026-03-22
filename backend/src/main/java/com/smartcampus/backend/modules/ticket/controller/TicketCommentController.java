//Responsible for handling HTTP requests related to ticket comments.
package com.smartcampus.backend.modules.ticket.controller;

import com.smartcampus.backend.modules.ticket.dto.TicketCommentCreateDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketCommentUpdateDTO;
import com.smartcampus.backend.modules.ticket.entity.TicketComment;
import com.smartcampus.backend.modules.ticket.service.TicketCommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ticket-comments")
public class TicketCommentController {

    @Autowired
    private TicketCommentService ticketCommentService;

    /**
     * Add/Create a new comment
     */
    @PostMapping
    public ResponseEntity<?> addComment(@RequestBody TicketCommentCreateDTO commentDTO) {
        try {
            TicketComment comment = ticketCommentService.addComment(commentDTO);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Ticket comment created successfully");
            response.put("data", comment);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Update an existing comment
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateComment(@PathVariable Long id, @RequestBody TicketCommentUpdateDTO updateDTO) {
        try {
            TicketComment updatedComment = ticketCommentService.updateComment(id, updateDTO);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Ticket comment updated successfully");
            response.put("data", updatedComment);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Get comments by ticket
     */
    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<?> getCommentsByTicket(@PathVariable Long ticketId) {
        try {
            List<TicketComment> comments = ticketCommentService.getCommentsByTicket(ticketId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", comments);
            response.put("count", comments.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Delete a ticket comment
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComment(@PathVariable Long id) {
        try {
            ticketCommentService.deleteComment(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Ticket comment deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
}
