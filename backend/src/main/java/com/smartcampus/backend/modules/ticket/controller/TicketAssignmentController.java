//Responsible for handling HTTP requests related to ticket assignments.
package com.smartcampus.backend.modules.ticket.controller;

import com.smartcampus.backend.modules.ticket.dto.TicketAssignmentCreateDTO;
import com.smartcampus.backend.modules.ticket.entity.TicketAssignment;
import com.smartcampus.backend.modules.ticket.service.TicketAssignmentService;
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
@RequestMapping("/api/ticket-assignments")
public class TicketAssignmentController {

    @Autowired
    private TicketAssignmentService ticketAssignmentService;

    /**
     * Add/Create a new ticket assignment
     */
    @PostMapping
    public ResponseEntity<?> addAssignment(@RequestBody TicketAssignmentCreateDTO assignmentDTO) {
        try {
            TicketAssignment assignment = ticketAssignmentService.addAssignment(assignmentDTO);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Ticket assignment created successfully");
            response.put("data", assignment);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Get assignments by ticket
     */
    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<?> getAssignmentsByTicket(@PathVariable Long ticketId) {
        try {
            List<TicketAssignment> assignments = ticketAssignmentService.getAssignmentsByTicket(ticketId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", assignments);
            response.put("count", assignments.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get assignments by technician
     */
    @GetMapping("/technician/{technicianId}")
    public ResponseEntity<?> getAssignmentsByTechnician(@PathVariable Long technicianId) {
        try {
            List<TicketAssignment> assignments = ticketAssignmentService.getAssignmentsByTechnician(technicianId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", assignments);
            response.put("count", assignments.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Delete a ticket assignment
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAssignment(@PathVariable Long id) {
        try {
            ticketAssignmentService.deleteAssignment(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Ticket assignment deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
}
