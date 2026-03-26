//Handles the business logic for technician assignments.
package com.smartcampus.backend.modules.ticket.service;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.modules.ticket.dto.TicketAssignmentCreateDTO;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketAssignment;
import com.smartcampus.backend.modules.ticket.repository.TicketAssignmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TicketAssignmentService {

    @Autowired
    private TicketAssignmentRepository ticketAssignmentRepository;

    @Autowired
    private TicketService ticketService;

    /**
     * Assign a technician to a ticket
     */
    public TicketAssignment addAssignment(TicketAssignmentCreateDTO assignmentDTO) {
        validateAssignmentRequest(assignmentDTO);

        Ticket ticket = ticketService.getTicketById(assignmentDTO.getTicketId());

        TicketAssignment assignment = new TicketAssignment();
        assignment.setTicket(ticket);

        User technician = new User();
        technician.setUserId(assignmentDTO.getTechnicianId());
        assignment.setTechnician(technician);

        User assignedBy = new User();
        assignedBy.setUserId(assignmentDTO.getAssignedById());
        assignment.setAssignedBy(assignedBy);

        TicketAssignment savedAssignment = ticketAssignmentRepository.save(assignment);

        if ("OPEN".equals(ticket.getStatus())) {
            ticketService.updateTicketStatus(ticket.getId(), "IN_PROGRESS");
        }

        return savedAssignment;
    }

    /**
     * Get assignments for a ticket
     */
    public List<TicketAssignment> getAssignmentsByTicket(Long ticketId) {
        return ticketAssignmentRepository.findByTicketId(ticketId);
    }

    /**
     * Get assignments for a technician
     */
    public List<TicketAssignment> getAssignmentsByTechnician(Long technicianId) {
        return ticketAssignmentRepository.findByTechnicianId(technicianId);
    }

    /**
     * Delete an assignment
     */
    public void deleteAssignment(Long id) {
        if (!ticketAssignmentRepository.existsById(id)) {
            throw new RuntimeException("Ticket assignment not found with id: " + id);
        }

        ticketAssignmentRepository.deleteById(id);
    }

    private void validateAssignmentRequest(TicketAssignmentCreateDTO assignmentDTO) {
        if (assignmentDTO.getTicketId() == null) {
            throw new RuntimeException("Ticket ID is required");
        }

        if (assignmentDTO.getTechnicianId() == null) {
            throw new RuntimeException("Technician ID is required");
        }

        if (assignmentDTO.getAssignedById() == null) {
            throw new RuntimeException("Assigned by user ID is required");
        }
    }
}
