//Handles the business logic for ticket attachments.
package com.smartcampus.backend.modules.ticket.service;

import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentCreateDTO;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketAttachment;
import com.smartcampus.backend.modules.ticket.repository.TicketAttachmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TicketAttachmentService {

    @Autowired
    private TicketAttachmentRepository ticketAttachmentRepository;

    @Autowired
    private TicketService ticketService;

    /**
     * Add an attachment to a ticket
     */
    public TicketAttachment addAttachment(TicketAttachmentCreateDTO attachmentDTO) {
        validateAttachmentCreateRequest(attachmentDTO);

        TicketAttachment attachment = new TicketAttachment();

        Ticket ticket = ticketService.getTicketById(attachmentDTO.getTicketId());
        attachment.setTicket(ticket);
        attachment.setFileName(attachmentDTO.getFileName());
        attachment.setFileUrl(attachmentDTO.getFileUrl());
        attachment.setFileType(attachmentDTO.getFileType());
        attachment.setFileSize(attachmentDTO.getFileSize());

        return ticketAttachmentRepository.save(attachment);
    }

    /**
     * Get attachments for a ticket
     */
    public List<TicketAttachment> getAttachmentsByTicket(Long ticketId) {
        return ticketAttachmentRepository.findByTicketId(ticketId);
    }

    /**
     * Delete an attachment
     */
    public void deleteAttachment(Long id) {
        if (!ticketAttachmentRepository.existsById(id)) {
            throw new RuntimeException("Ticket attachment not found with id: " + id);
        }

        ticketAttachmentRepository.deleteById(id);
    }

    private void validateAttachmentCreateRequest(TicketAttachmentCreateDTO attachmentDTO) {
        if (attachmentDTO.getTicketId() == null) {
            throw new RuntimeException("Ticket ID is required");
        }

        if (attachmentDTO.getFileName() == null || attachmentDTO.getFileName().isBlank()) {
            throw new RuntimeException("File name is required");
        }

        if (attachmentDTO.getFileUrl() == null || attachmentDTO.getFileUrl().isBlank()) {
            throw new RuntimeException("File URL is required");
        }
    }
}
