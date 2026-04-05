package com.smartcampus.backend.modules.ticket.service;

import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentCreateDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentResponseDTO;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketAttachment;
import com.smartcampus.backend.modules.ticket.mapper.TicketMapper;
import com.smartcampus.backend.modules.ticket.repository.TicketAttachmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TicketAttachmentService {

    private final TicketAttachmentRepository ticketAttachmentRepository;
    private final TicketService ticketService;

    public TicketAttachmentService(TicketAttachmentRepository ticketAttachmentRepository, TicketService ticketService) {
        this.ticketAttachmentRepository = ticketAttachmentRepository;
        this.ticketService = ticketService;
    }

    @Transactional
    public TicketAttachmentResponseDTO addAttachment(Long ticketId, TicketAttachmentCreateDTO attachmentDTO) {
        if (ticketAttachmentRepository.countByTicketId(ticketId) >= 3) {
            throw new IllegalArgumentException("A ticket can have at most 3 attachments");
        }

        if (attachmentDTO.getFileType() != null
                && !attachmentDTO.getFileType().isBlank()
                && !attachmentDTO.getFileType().toLowerCase().startsWith("image/")) {
            throw new IllegalArgumentException("Only image attachments are supported");
        }

        Ticket ticket = ticketService.getTicketEntity(ticketId);

        TicketAttachment attachment = new TicketAttachment();
        attachment.setTicket(ticket);
        attachment.setFileName(attachmentDTO.getFileName().trim());
        attachment.setFileUrl(attachmentDTO.getFileUrl().trim());
        attachment.setFileType(attachmentDTO.getFileType());
        attachment.setFileSize(attachmentDTO.getFileSize());

        return TicketMapper.toAttachmentResponse(ticketAttachmentRepository.save(attachment));
    }

    @Transactional(readOnly = true)
    public List<TicketAttachmentResponseDTO> getAttachmentsByTicket(Long ticketId) {
        ticketService.getTicketEntity(ticketId);
        return ticketAttachmentRepository.findByTicketIdOrderByUploadedAtAsc(ticketId)
                .stream()
                .map(TicketMapper::toAttachmentResponse)
                .toList();
    }

    @Transactional
    public void deleteAttachment(Long ticketId, Long attachmentId) {
        TicketAttachment attachment = ticketAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket attachment not found with id: " + attachmentId));
        if (!attachment.getTicket().getId().equals(ticketId)) {
            throw new IllegalArgumentException("Attachment does not belong to the selected ticket");
        }

        ticketAttachmentRepository.delete(attachment);
    }
}
