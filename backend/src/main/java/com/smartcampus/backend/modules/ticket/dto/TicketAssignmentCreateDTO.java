//Used for assigning technicians to tickets.
package com.smartcampus.backend.modules.ticket.dto;

public class TicketAssignmentCreateDTO {

    private Long ticketId;
    private Long technicianId;
    private Long assignedById;

    // Constructors
    public TicketAssignmentCreateDTO() {}

    public TicketAssignmentCreateDTO(Long ticketId, Long technicianId, Long assignedById) {
        this.ticketId = ticketId;
        this.technicianId = technicianId;
        this.assignedById = assignedById;
    }

    // Getters and Setters
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

    public Long getAssignedById() {
        return assignedById;
    }

    public void setAssignedById(Long assignedById) {
        this.assignedById = assignedById;
    }
}
