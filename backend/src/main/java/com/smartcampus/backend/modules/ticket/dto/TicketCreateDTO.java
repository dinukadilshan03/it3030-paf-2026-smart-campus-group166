//Used for creating new maintenance tickets.
package com.smartcampus.backend.modules.ticket.dto;

public class TicketCreateDTO {

    private Long resourceId;
    private Long reportedById;
    private String category;
    private String priority;
    private String description;
    private String preferredContact;

    // Constructors
    public TicketCreateDTO() {}

    public TicketCreateDTO(Long resourceId, Long reportedById, String category, String priority,
                           String description, String preferredContact) {
        this.resourceId = resourceId;
        this.reportedById = reportedById;
        this.category = category;
        this.priority = priority;
        this.description = description;
        this.preferredContact = preferredContact;
    }

    // Getters and Setters
    public Long getResourceId() {
        return resourceId;
    }

    public void setResourceId(Long resourceId) {
        this.resourceId = resourceId;
    }

    public Long getReportedById() {
        return reportedById;
    }

    public void setReportedById(Long reportedById) {
        this.reportedById = reportedById;
    }

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

    public String getPreferredContact() {
        return preferredContact;
    }

    public void setPreferredContact(String preferredContact) {
        this.preferredContact = preferredContact;
    }
}
