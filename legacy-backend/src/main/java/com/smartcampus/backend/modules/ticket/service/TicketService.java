package com.smartcampus.backend.modules.ticket.service;

import com.smartcampus.backend.common.entity.Resource;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.common.repository.UserRepository;
import com.smartcampus.backend.modules.resource.repository.ResourceRepository;
import com.smartcampus.backend.modules.ticket.dto.TicketCreateDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketDetailsResponseDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketResponseDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketUpdateDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketWorkflowUpdateDTO;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketAssignment;
import com.smartcampus.backend.modules.ticket.enums.TicketPriority;
import com.smartcampus.backend.modules.ticket.enums.TicketStatus;
import com.smartcampus.backend.modules.ticket.mapper.TicketMapper;
import com.smartcampus.backend.modules.ticket.repository.TicketAssignmentRepository;
import com.smartcampus.backend.modules.ticket.repository.TicketAttachmentRepository;
import com.smartcampus.backend.modules.ticket.repository.TicketCommentRepository;
import com.smartcampus.backend.modules.ticket.repository.TicketRepository;
import com.smartcampus.backend.modules.ticket.repository.TicketSpecifications;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketAssignmentRepository ticketAssignmentRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final TicketAttachmentRepository ticketAttachmentRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;

    public TicketService(
            TicketRepository ticketRepository,
            TicketAssignmentRepository ticketAssignmentRepository,
            TicketCommentRepository ticketCommentRepository,
            TicketAttachmentRepository ticketAttachmentRepository,
            ResourceRepository resourceRepository,
            UserRepository userRepository
    ) {
        this.ticketRepository = ticketRepository;
        this.ticketAssignmentRepository = ticketAssignmentRepository;
        this.ticketCommentRepository = ticketCommentRepository;
        this.ticketAttachmentRepository = ticketAttachmentRepository;
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public TicketResponseDTO addTicket(TicketCreateDTO ticketDTO) {
        Resource resource = resourceRepository.findById(ticketDTO.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + ticketDTO.getResourceId()));
        User reportedBy = userRepository.findById(ticketDTO.getReportedById())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + ticketDTO.getReportedById()));

        Ticket ticket = new Ticket();
        ticket.setResource(resource);
        ticket.setReportedBy(reportedBy);
        ticket.setCategory(ticketDTO.getCategory().trim());
        ticket.setPriority(parsePriority(ticketDTO.getPriority()));
        ticket.setDescription(ticketDTO.getDescription().trim());
        ticket.setPreferredContact(trimToNull(ticketDTO.getPreferredContact()));
        ticket.setStatus(TicketStatus.OPEN);

        return TicketMapper.toTicketResponse(ticketRepository.save(ticket), null);
    }

    @Transactional
    public TicketResponseDTO updateTicket(Long id, TicketUpdateDTO updateDTO) {
        Ticket ticket = getTicketEntity(id);

        if (updateDTO.getCategory() != null && !updateDTO.getCategory().isBlank()) {
            ticket.setCategory(updateDTO.getCategory().trim());
        }

        if (updateDTO.getPriority() != null && !updateDTO.getPriority().isBlank()) {
            ticket.setPriority(parsePriority(updateDTO.getPriority()));
        }

        if (updateDTO.getDescription() != null && !updateDTO.getDescription().isBlank()) {
            ticket.setDescription(updateDTO.getDescription().trim());
        }

        if (updateDTO.getPreferredContact() != null) {
            ticket.setPreferredContact(trimToNull(updateDTO.getPreferredContact()));
        }

        Ticket savedTicket = ticketRepository.save(ticket);
        return TicketMapper.toTicketResponse(savedTicket, getCurrentAssignment(savedTicket.getId()));
    }

    @Transactional(readOnly = true)
    public List<TicketResponseDTO> getAllTickets(String status, String priority, String category, String search) {
        Specification<Ticket> specification = Specification
                .where(TicketSpecifications.hasStatus(parseStatus(status)))
                .and(TicketSpecifications.hasPriority(parsePriority(priority)))
                .and(TicketSpecifications.hasCategory(category))
                .and(TicketSpecifications.matchesSearch(search));

        List<Ticket> tickets = ticketRepository.findAll(specification, Sort.by(Sort.Direction.DESC, "createdAt"));
        Map<Long, TicketAssignment> latestAssignments = getLatestAssignments(tickets);

        return tickets.stream()
                .map(ticket -> TicketMapper.toTicketResponse(ticket, latestAssignments.get(ticket.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public TicketDetailsResponseDTO getTicketDetails(Long id) {
        Ticket ticket = getTicketEntity(id);
        List<TicketAssignment> assignments = ticketAssignmentRepository.findByTicketIdOrderByAssignedAtDesc(id);

        return new TicketDetailsResponseDTO(
                TicketMapper.toTicketResponse(ticket, assignments.isEmpty() ? null : assignments.get(0)),
                assignments.stream().map(TicketMapper::toAssignmentResponse).toList(),
                ticketCommentRepository.findByTicketIdOrderByCreatedAtAsc(id)
                        .stream()
                        .map(TicketMapper::toCommentResponse)
                        .toList(),
                ticketAttachmentRepository.findByTicketIdOrderByUploadedAtAsc(id)
                        .stream()
                        .map(TicketMapper::toAttachmentResponse)
                        .toList()
        );
    }

    @Transactional
    public TicketResponseDTO updateTicketWorkflow(Long id, TicketWorkflowUpdateDTO workflowUpdateDTO) {
        Ticket ticket = getTicketEntity(id);
        TicketStatus nextStatus = parseStatus(workflowUpdateDTO.getStatus());
        validateStatusTransition(ticket.getStatus(), nextStatus);

        String resolutionNotes = trimToNull(workflowUpdateDTO.getResolutionNotes());
        String rejectionReason = trimToNull(workflowUpdateDTO.getRejectionReason());

        if (nextStatus == TicketStatus.RESOLVED && resolutionNotes == null && ticket.getResolutionNotes() == null) {
            throw new IllegalArgumentException("Resolution notes are required when resolving a ticket");
        }

        if (nextStatus == TicketStatus.REJECTED && rejectionReason == null) {
            throw new IllegalArgumentException("A rejection reason is required when rejecting a ticket");
        }

        ticket.setStatus(nextStatus);

        if (nextStatus == TicketStatus.REJECTED) {
            ticket.setRejectionReason(rejectionReason);
            ticket.setResolutionNotes(null);
        } else {
            ticket.setRejectionReason(null);
            if (resolutionNotes != null) {
                ticket.setResolutionNotes(resolutionNotes);
            }
        }

        Ticket savedTicket = ticketRepository.save(ticket);
        return TicketMapper.toTicketResponse(savedTicket, getCurrentAssignment(savedTicket.getId()));
    }

    @Transactional
    public void deleteTicket(Long id) {
        Ticket ticket = getTicketEntity(id);
        ticketRepository.delete(ticket);
    }

    @Transactional
    public Ticket updateTicketStatus(Long id, TicketStatus status) {
        Ticket ticket = getTicketEntity(id);
        ticket.setStatus(status);
        return ticketRepository.save(ticket);
    }

    @Transactional(readOnly = true)
    public Ticket getTicketEntity(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));
    }

    private Map<Long, TicketAssignment> getLatestAssignments(List<Ticket> tickets) {
        if (tickets.isEmpty()) {
            return Map.of();
        }

        List<Long> ticketIds = tickets.stream().map(Ticket::getId).toList();

        return ticketAssignmentRepository.findLatestAssignments(ticketIds)
                .stream()
                .collect(Collectors.toMap(
                        assignment -> assignment.getTicket().getId(),
                        assignment -> assignment,
                        (left, right) -> left,
                        HashMap::new
                ));
    }

    private TicketAssignment getCurrentAssignment(Long ticketId) {
        return ticketAssignmentRepository.findFirstByTicketIdOrderByAssignedAtDesc(ticketId).orElse(null);
    }

    private TicketPriority parsePriority(String priority) {
        if (priority == null || priority.isBlank()) {
            return null;
        }

        try {
            return TicketPriority.valueOf(priority.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid ticket priority: " + priority);
        }
    }

    private TicketStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        try {
            return TicketStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid ticket status: " + status);
        }
    }

    private void validateStatusTransition(TicketStatus currentStatus, TicketStatus nextStatus) {
        if (currentStatus == nextStatus) {
            return;
        }

        boolean validTransition = switch (currentStatus) {
            case OPEN -> nextStatus == TicketStatus.IN_PROGRESS || nextStatus == TicketStatus.REJECTED;
            case IN_PROGRESS -> nextStatus == TicketStatus.RESOLVED || nextStatus == TicketStatus.REJECTED;
            case RESOLVED -> nextStatus == TicketStatus.CLOSED || nextStatus == TicketStatus.IN_PROGRESS;
            case CLOSED, REJECTED -> false;
        };

        if (!validTransition) {
            throw new IllegalArgumentException("Invalid ticket status transition from " + currentStatus + " to " + nextStatus);
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
