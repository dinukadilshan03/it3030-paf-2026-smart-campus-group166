//Responsible for handling HTTP requests related to maintenance tickets.
package com.smartcampus.backend.modules.ticket.controller;

import com.smartcampus.backend.modules.ticket.dto.TicketCreateDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketUpdateDTO;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.service.TicketService;
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
@RequestMapping("/api/tickets")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    /**
     * Add/Create a new ticket
     */
    @PostMapping
    public ResponseEntity<?> addTicket(@RequestBody TicketCreateDTO ticketDTO) {
        try {
            Ticket ticket = ticketService.addTicket(ticketDTO);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Ticket created successfully");
            response.put("data", ticket);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Update an existing ticket
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTicket(@PathVariable Long id, @RequestBody TicketUpdateDTO updateDTO) {
        try {
            Ticket updatedTicket = ticketService.updateTicket(id, updateDTO);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Ticket updated successfully");
            response.put("data", updatedTicket);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Get all tickets
     */
    @GetMapping
    public ResponseEntity<?> getAllTickets() {
        try {
            List<Ticket> tickets = ticketService.getAllTickets();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", tickets);
            response.put("count", tickets.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get ticket by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getTicket(@PathVariable Long id) {
        try {
            Ticket ticket = ticketService.getTicketById(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", ticket);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    /**
     * Get tickets by reporter
     */
    @GetMapping("/reporter/{reportedById}")
    public ResponseEntity<?> getTicketsByReporter(@PathVariable Long reportedById) {
        try {
            List<Ticket> tickets = ticketService.getTicketsByReporter(reportedById);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", tickets);
            response.put("count", tickets.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get tickets by resource
     */
    @GetMapping("/resource/{resourceId}")
    public ResponseEntity<?> getTicketsByResource(@PathVariable Long resourceId) {
        try {
            List<Ticket> tickets = ticketService.getTicketsByResource(resourceId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", tickets);
            response.put("count", tickets.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get tickets by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<?> getTicketsByStatus(@PathVariable String status) {
        try {
            List<Ticket> tickets = ticketService.getTicketsByStatus(status);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", tickets);
            response.put("count", tickets.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get tickets by priority
     */
    @GetMapping("/priority/{priority}")
    public ResponseEntity<?> getTicketsByPriority(@PathVariable String priority) {
        try {
            List<Ticket> tickets = ticketService.getTicketsByPriority(priority);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", tickets);
            response.put("count", tickets.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Delete a ticket
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTicket(@PathVariable Long id) {
        try {
            ticketService.deleteTicket(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Ticket deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
}
