//Used for returning ticket comment details in API responses.
package com.smartcampus.backend.modules.ticket.dto;

import java.time.LocalDateTime;

public class TicketCommentResponseDTO {

    private Long id;
    private Long ticketId;
    private Long userId;
    private String userName;
    private String userEmail;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public TicketCommentResponseDTO() {}

    public TicketCommentResponseDTO(
            Long id,
            Long ticketId,
            Long userId,
            String userName,
            String userEmail,
            String content,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.ticketId = ticketId;
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.content = content;
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

    public Long getTicketId() {
        return ticketId;
    }

    public void setTicketId(Long ticketId) {
        this.ticketId = ticketId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
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
