//Used for adding comments to maintenance tickets.
package com.smartcampus.backend.modules.ticket.dto;

public class TicketCommentCreateDTO {

    private Long ticketId;
    private Long userId;
    private String content;

    // Constructors
    public TicketCommentCreateDTO() {}

    public TicketCommentCreateDTO(Long ticketId, Long userId, String content) {
        this.ticketId = ticketId;
        this.userId = userId;
        this.content = content;
    }

    // Getters and Setters
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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
