package com.smartcampus.backend.modules.ticket.dto;

import jakarta.validation.constraints.NotBlank;

public class TicketWorkflowUpdateDTO {

    @NotBlank(message = "Status is required")
    private String status;

    private String resolutionNotes;

    private String rejectionReason;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}
