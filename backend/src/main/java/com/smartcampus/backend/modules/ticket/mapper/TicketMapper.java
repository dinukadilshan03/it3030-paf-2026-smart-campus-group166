package com.smartcampus.backend.modules.ticket.mapper;

import com.smartcampus.backend.modules.ticket.dto.TicketAssignmentResponseDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentResponseDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketCommentResponseDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketResponseDTO;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketAssignment;
import com.smartcampus.backend.modules.ticket.entity.TicketAttachment;
import com.smartcampus.backend.modules.ticket.entity.TicketComment;

public final class TicketMapper {

    private TicketMapper() {
    }

    public static TicketResponseDTO toTicketResponse(Ticket ticket, TicketAssignment currentAssignment) {
        TicketResponseDTO response = new TicketResponseDTO();
        response.setId(ticket.getId());
        response.setResourceId(ticket.getResource().getId());
        response.setResourceName(ticket.getResource().getName());
        response.setResourceType(ticket.getResource().getType());
        response.setResourceLocation(ticket.getResource().getLocation());
        response.setReportedById(ticket.getReportedBy().getUserId());
        response.setReportedByName(ticket.getReportedBy().getName());
        response.setReportedByEmail(ticket.getReportedBy().getEmail());
        response.setCategory(ticket.getCategory());
        response.setPriority(ticket.getPriority().name());
        response.setDescription(ticket.getDescription());
        response.setStatus(ticket.getStatus().name());
        response.setPreferredContact(ticket.getPreferredContact());
        response.setResolutionNotes(ticket.getResolutionNotes());
        response.setRejectionReason(ticket.getRejectionReason());
        response.setCreatedAt(ticket.getCreatedAt());
        response.setUpdatedAt(ticket.getUpdatedAt());
        response.setCurrentAssignment(currentAssignment == null ? null : toAssignmentResponse(currentAssignment));
        return response;
    }

    public static TicketAssignmentResponseDTO toAssignmentResponse(TicketAssignment assignment) {
        TicketAssignmentResponseDTO response = new TicketAssignmentResponseDTO();
        response.setId(assignment.getId());
        response.setTicketId(assignment.getTicket().getId());
        response.setTechnicianId(assignment.getTechnician().getUserId());
        response.setTechnicianName(assignment.getTechnician().getName());
        response.setTechnicianEmail(assignment.getTechnician().getEmail());
        response.setAssignedById(assignment.getAssignedBy().getUserId());
        response.setAssignedByName(assignment.getAssignedBy().getName());
        response.setAssignedAt(assignment.getAssignedAt());
        return response;
    }

    public static TicketCommentResponseDTO toCommentResponse(TicketComment comment) {
        TicketCommentResponseDTO response = new TicketCommentResponseDTO();
        response.setId(comment.getId());
        response.setTicketId(comment.getTicket().getId());
        response.setUserId(comment.getUser().getUserId());
        response.setUserName(comment.getUser().getName());
        response.setUserEmail(comment.getUser().getEmail());
        response.setContent(comment.getContent());
        response.setCreatedAt(comment.getCreatedAt());
        response.setUpdatedAt(comment.getUpdatedAt());
        return response;
    }

    public static TicketAttachmentResponseDTO toAttachmentResponse(TicketAttachment attachment) {
        TicketAttachmentResponseDTO response = new TicketAttachmentResponseDTO();
        response.setId(attachment.getId());
        response.setTicketId(attachment.getTicket().getId());
        response.setFileName(attachment.getFileName());
        response.setFileUrl(attachment.getFileUrl());
        response.setFileType(attachment.getFileType());
        response.setFileSize(attachment.getFileSize());
        response.setUploadedAt(attachment.getUploadedAt());
        return response;
    }
}
