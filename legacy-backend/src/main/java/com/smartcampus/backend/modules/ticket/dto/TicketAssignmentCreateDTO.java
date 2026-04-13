//Used for assigning technicians to tickets.
package com.smartcampus.backend.modules.ticket.dto;

import jakarta.validation.constraints.NotNull;

public class TicketAssignmentCreateDTO {

    @NotNull(message = "Technician ID is required")
    private Long technicianId;

    // Constructors
    public TicketAssignmentCreateDTO() {}

    public TicketAssignmentCreateDTO(Long technicianId) {
        this.technicianId = technicianId;
    }

    public Long getTechnicianId() {
        return technicianId;
    }

    public void setTechnicianId(Long technicianId) {
        this.technicianId = technicianId;
    }
}
