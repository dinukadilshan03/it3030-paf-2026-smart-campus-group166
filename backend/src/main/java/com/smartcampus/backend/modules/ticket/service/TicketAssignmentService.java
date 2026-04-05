package com.smartcampus.backend.modules.ticket.service;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.enums.RoleType;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.common.repository.UserRepository;
import com.smartcampus.backend.modules.auth.service.CurrentUserService;
import com.smartcampus.backend.modules.ticket.dto.TicketAssignmentCreateDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketAssignmentResponseDTO;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketAssignment;
import com.smartcampus.backend.modules.ticket.enums.TicketStatus;
import com.smartcampus.backend.modules.ticket.mapper.TicketMapper;
import com.smartcampus.backend.modules.ticket.repository.TicketAssignmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TicketAssignmentService {

    private final TicketAssignmentRepository ticketAssignmentRepository;
    private final TicketService ticketService;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public TicketAssignmentService(
            TicketAssignmentRepository ticketAssignmentRepository,
            TicketService ticketService,
            UserRepository userRepository,
            CurrentUserService currentUserService
    ) {
        this.ticketAssignmentRepository = ticketAssignmentRepository;
        this.ticketService = ticketService;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public TicketAssignmentResponseDTO addAssignment(Long ticketId, TicketAssignmentCreateDTO assignmentDTO) {
        Ticket ticket = ticketService.getTicketEntity(ticketId);
        if (ticket.getStatus() == TicketStatus.CLOSED || ticket.getStatus() == TicketStatus.REJECTED) {
            throw new IllegalArgumentException("Finalized tickets cannot receive new assignments");
        }

        User technician = userRepository.findById(assignmentDTO.getTechnicianId())
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found with id: " + assignmentDTO.getTechnicianId()));
        if (technician.getRole() == null || !RoleType.TECHNICIAN.name().equals(technician.getRole().getRoleName())) {
            throw new IllegalArgumentException("Selected user is not a technician");
        }

        User assignedBy = currentUserService.getCurrentUser();

        TicketAssignment assignment = new TicketAssignment();
        assignment.setTicket(ticket);
        assignment.setTechnician(technician);
        assignment.setAssignedBy(assignedBy);

        TicketAssignment savedAssignment = ticketAssignmentRepository.save(assignment);

        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticketService.updateTicketStatus(ticket.getId(), TicketStatus.IN_PROGRESS);
        }

        return TicketMapper.toAssignmentResponse(savedAssignment);
    }

    @Transactional(readOnly = true)
    public List<TicketAssignmentResponseDTO> getAssignmentsByTicket(Long ticketId) {
        ticketService.getTicketEntity(ticketId);
        return ticketAssignmentRepository.findByTicketIdOrderByAssignedAtDesc(ticketId)
                .stream()
                .map(TicketMapper::toAssignmentResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TicketAssignmentResponseDTO> getAssignmentsByTechnician(Long technicianId) {
        return ticketAssignmentRepository.findByTechnicianId(technicianId)
                .stream()
                .map(TicketMapper::toAssignmentResponse)
                .toList();
    }

    @Transactional
    public void deleteAssignment(Long ticketId, Long assignmentId) {
        TicketAssignment assignment = ticketAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket assignment not found with id: " + assignmentId));
        if (!assignment.getTicket().getId().equals(ticketId)) {
            throw new IllegalArgumentException("Assignment does not belong to the selected ticket");
        }

        ticketAssignmentRepository.delete(assignment);
    }
}
