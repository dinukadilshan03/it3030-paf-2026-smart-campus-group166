//Used for returning ticket details in API responses.
package com.smartcampus.backend.modules.ticket.dto;

import java.time.LocalDateTime;

public class TicketResponseDTO {

    private Long id;
    private Long resourceId;
    private String resourceName;
    private Long reportedById;
    private String reportedByName;
    private String category;
    private String priority;
    private String description;
    private String status;
    private String preferredContact;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public TicketResponseDTO() {}

    public TicketResponseDTO(Long id, Long resourceId, String resourceName, Long reportedById,
                             String reportedByName, String category, String priority,
                             String description, String status, String preferredContact,
                             LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.resourceId = resourceId;
        this.resourceName = resourceName;
        this.reportedById = reportedById;
        this.reportedByName = reportedByName;
        this.category = category;
        this.priority = priority;
        this.description = description;
        this.status = status;
        this.preferredContact = preferredContact;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getResourceId() {
        return resourceId;
    }

    public void setResourceId(Long resourceId) {
        this.resourceId = resourceId;
    }

    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public Long getReportedById() {
        return reportedById;
    }

    public void setReportedById(Long reportedById) {
        this.reportedById = reportedById;
    }

    public String getReportedByName() {
        return reportedByName;
    }

    public void setReportedByName(String reportedByName) {
        this.reportedByName = reportedByName;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
