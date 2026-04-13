package com.smartcampus.backend.modules.ticket.service;

import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.exception.DuplicateResourceException;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.modules.ticket.dto.CreateTicketAttachmentRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentResponse;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketAttachment;
import com.smartcampus.backend.modules.ticket.mapper.TicketMapper;
import com.smartcampus.backend.modules.ticket.repository.TicketAttachmentRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TicketAttachmentService {

    private final TicketAttachmentRepository ticketAttachmentRepository;
    private final TicketAccessService ticketAccessService;
    private final TicketMapper ticketMapper;

    @Transactional(readOnly = true)
    public List<TicketAttachmentResponse> getAttachments(Ticket ticket) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        ticketAccessService.ensureCanViewTicket(membership, ticket);

        return ticketAttachmentRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId()).stream()
                .map(ticketMapper::toAttachmentResponse)
                .toList();
    }

    @Transactional
    public TicketAttachmentResponse addAttachment(
            Ticket ticket, CreateTicketAttachmentRequest request) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        ticketAccessService.ensureCanManageAttachments(membership, ticket);

        if (ticketAttachmentRepository.countByTicket_Id(ticket.getId()) >= 3) {
            throw new IllegalArgumentException("A ticket can have at most 3 attachments");
        }

        TicketAttachment attachment =
                TicketAttachment.builder()
                        .ticket(ticket)
                        .uploadedByUser(membership.getUser())
                        .fileName(request.fileName().trim())
                        .storageBucket(request.storageBucket().trim())
                        .storagePath(request.storagePath().trim())
                        .mimeType(normalizeOptionalText(request.mimeType()))
                        .fileSize(request.fileSize())
                        .attachmentType(normalizeOptionalText(request.attachmentType()))
                        .build();

        try {
            return ticketMapper.toAttachmentResponse(ticketAttachmentRepository.save(attachment));
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateResourceException("Attachment storage path already exists");
        }
    }

    @Transactional
    public void deleteAttachment(Long ticketId, Long attachmentId, Ticket ticket) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        ticketAccessService.ensureCanManageAttachments(membership, ticket);

        TicketAttachment attachment =
                ticketAttachmentRepository
                        .findByIdAndTicketId(attachmentId, ticketId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Attachment not found for ticket id: " + ticketId));
        ticketAttachmentRepository.delete(attachment);
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
