package com.smartcampus.backend.modules.ticket.dto;

import java.util.List;

public class TicketDetailsResponseDTO {

    private TicketResponseDTO ticket;
    private List<TicketAssignmentResponseDTO> assignments;
    private List<TicketCommentResponseDTO> comments;
    private List<TicketAttachmentResponseDTO> attachments;

    public TicketDetailsResponseDTO() {
    }

    public TicketDetailsResponseDTO(
            TicketResponseDTO ticket,
            List<TicketAssignmentResponseDTO> assignments,
            List<TicketCommentResponseDTO> comments,
            List<TicketAttachmentResponseDTO> attachments
    ) {
        this.ticket = ticket;
        this.assignments = assignments;
        this.comments = comments;
        this.attachments = attachments;
    }

    public TicketResponseDTO getTicket() {
        return ticket;
    }

    public void setTicket(TicketResponseDTO ticket) {
        this.ticket = ticket;
    }

    public List<TicketAssignmentResponseDTO> getAssignments() {
        return assignments;
    }

    public void setAssignments(List<TicketAssignmentResponseDTO> assignments) {
        this.assignments = assignments;
    }

    public List<TicketCommentResponseDTO> getComments() {
        return comments;
    }

    public void setComments(List<TicketCommentResponseDTO> comments) {
        this.comments = comments;
    }

    public List<TicketAttachmentResponseDTO> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<TicketAttachmentResponseDTO> attachments) {
        this.attachments = attachments;
    }
}
