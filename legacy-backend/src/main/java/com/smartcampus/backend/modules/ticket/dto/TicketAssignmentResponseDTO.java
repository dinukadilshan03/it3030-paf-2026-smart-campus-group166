//Used for returning ticket assignment details in API responses.
package com.smartcampus.backend.modules.ticket.dto;

import java.time.LocalDateTime;

public class TicketAssignmentResponseDTO {

    private Long id;
    private Long ticketId;
    private Long technicianId;
    private String technicianName;
    private String technicianEmail;
    private Long assignedById;
    private String assignedByName;
    private LocalDateTime assignedAt;

    // Constructors
    public TicketAssignmentResponseDTO() {}

    public TicketAssignmentResponseDTO(
            Long id,
            Long ticketId,
            Long technicianId,
            String technicianName,
            String technicianEmail,
            Long assignedById,
            String assignedByName,
            LocalDateTime assignedAt
    ) {
        this.id = id;
        this.ticketId = ticketId;
        this.technicianId = technicianId;
        this.technicianName = technicianName;
        this.technicianEmail = technicianEmail;
        this.assignedById = assignedById;
        this.assignedByName = assignedByName;
        this.assignedAt = assignedAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTicketId() {
        return ticketId;
    }

    public void setTicketId(Long ticketId) {
        this.ticketId = ticketId;
    }

    public Long getTechnicianId() {
        return technicianId;
    }

    public void setTechnicianId(Long technicianId) {
        this.technicianId = technicianId;
    }

    public String getTechnicianName() {
        return technicianName;
    }

    public void setTechnicianName(String technicianName) {
        this.technicianName = technicianName;
    }

    public String getTechnicianEmail() {
        return technicianEmail;
    }

    public void setTechnicianEmail(String technicianEmail) {
        this.technicianEmail = technicianEmail;
    }

    public Long getAssignedById() {
        return assignedById;
    }

    public void setAssignedById(Long assignedById) {
        this.assignedById = assignedById;
    }

    public String getAssignedByName() {
        return assignedByName;
    }

    public void setAssignedByName(String assignedByName) {
        this.assignedByName = assignedByName;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }
}
