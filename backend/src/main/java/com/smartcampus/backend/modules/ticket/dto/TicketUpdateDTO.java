//Used for updating existing maintenance tickets.
package com.smartcampus.backend.modules.ticket.dto;

public class TicketUpdateDTO {

    private String category;
    private String priority;
    private String description;
    private String status;
    private String preferredContact;

    // Constructors
    public TicketUpdateDTO() {}

    public TicketUpdateDTO(String category, String priority, String description,
                           String status, String preferredContact) {
        this.category = category;
        this.priority = priority;
        this.description = description;
        this.status = status;
        this.preferredContact = preferredContact;
    }

    // Getters and Setters
    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPreferredContact() {
        return preferredContact;
    }

    public void setPreferredContact(String preferredContact) {
        this.preferredContact = preferredContact;
    }
}
