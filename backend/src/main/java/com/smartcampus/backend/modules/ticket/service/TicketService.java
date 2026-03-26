//Handles the business logic for managing maintenance tickets.
package com.smartcampus.backend.modules.ticket.service;

import com.smartcampus.backend.common.entity.Resource;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.modules.ticket.dto.TicketCreateDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketUpdateDTO;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TicketService {

    @Autowired
    private TicketRepository ticketRepository;

    /**
     * Create a new maintenance ticket
     */
    public Ticket addTicket(TicketCreateDTO ticketDTO) {
        validateTicketCreateRequest(ticketDTO);

        Ticket ticket = new Ticket();
        ticket.setCategory(ticketDTO.getCategory());
        ticket.setPriority(ticketDTO.getPriority());
        ticket.setDescription(ticketDTO.getDescription());
        ticket.setPreferredContact(ticketDTO.getPreferredContact());
        ticket.setStatus("OPEN");

        Resource resource = new Resource();
        resource.setId(ticketDTO.getResourceId());
        ticket.setResource(resource);

        User reportedBy = new User();
        reportedBy.setUserId(ticketDTO.getReportedById());
        ticket.setReportedBy(reportedBy);

        return ticketRepository.save(ticket);
    }

    /**
     * Update an existing maintenance ticket
     */
    public Ticket updateTicket(Long id, TicketUpdateDTO updateDTO) {
        Optional<Ticket> existingTicket = ticketRepository.findById(id);

        if (existingTicket.isEmpty()) {
            throw new RuntimeException("Ticket not found with id: " + id);
        }

        Ticket ticket = existingTicket.get();

        if (updateDTO.getCategory() != null) {
            ticket.setCategory(updateDTO.getCategory());
        }

        if (updateDTO.getPriority() != null) {
            ticket.setPriority(updateDTO.getPriority());
        }

        if (updateDTO.getDescription() != null) {
            ticket.setDescription(updateDTO.getDescription());
        }

        if (updateDTO.getStatus() != null) {
            ticket.setStatus(updateDTO.getStatus());
        }

        if (updateDTO.getPreferredContact() != null) {
            ticket.setPreferredContact(updateDTO.getPreferredContact());
        }

        return ticketRepository.save(ticket);
    }

    /**
     * Get all tickets
     */
    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    /**
     * Get ticket by ID
     */
    public Ticket getTicketById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + id));
    }

    /**
     * Get tickets reported by a user
     */
    public List<Ticket> getTicketsByReporter(Long reportedById) {
        return ticketRepository.findByReportedById(reportedById);
    }

    /**
     * Get tickets by resource
     */
    public List<Ticket> getTicketsByResource(Long resourceId) {
        return ticketRepository.findByResourceId(resourceId);
    }

    /**
     * Get tickets by status
     */
    public List<Ticket> getTicketsByStatus(String status) {
        return ticketRepository.findByStatus(status);
    }

    /**
     * Get tickets by priority
     */
    public List<Ticket> getTicketsByPriority(String priority) {
        return ticketRepository.findByPriority(priority);
    }

    /**
     * Delete a ticket
     */
    public void deleteTicket(Long id) {
        if (!ticketRepository.existsById(id)) {
            throw new RuntimeException("Ticket not found with id: " + id);
        }

        ticketRepository.deleteById(id);
    }

    /**
     * Update ticket status from internal maintenance actions
     */
    public Ticket updateTicketStatus(Long id, String status) {
        Ticket ticket = getTicketById(id);
        ticket.setStatus(status);
        return ticketRepository.save(ticket);
    }

    private void validateTicketCreateRequest(TicketCreateDTO ticketDTO) {
        if (ticketDTO.getResourceId() == null) {
            throw new RuntimeException("Resource ID is required");
        }

        if (ticketDTO.getReportedById() == null) {
            throw new RuntimeException("Reported by user ID is required");
        }

        if (ticketDTO.getCategory() == null || ticketDTO.getCategory().isBlank()) {
            throw new RuntimeException("Category is required");
        }

        if (ticketDTO.getPriority() == null || ticketDTO.getPriority().isBlank()) {
            throw new RuntimeException("Priority is required");
        }

        if (ticketDTO.getDescription() == null || ticketDTO.getDescription().isBlank()) {
            throw new RuntimeException("Description is required");
        }
    }
}
