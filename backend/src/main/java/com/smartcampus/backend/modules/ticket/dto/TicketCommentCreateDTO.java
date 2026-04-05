//Used for adding comments to maintenance tickets.
package com.smartcampus.backend.modules.ticket.dto;

import jakarta.validation.constraints.NotBlank;

public class TicketCommentCreateDTO {

    @NotBlank(message = "Comment content is required")
    private String content;

    // Constructors
    public TicketCommentCreateDTO() {}

    public TicketCommentCreateDTO(String content) {
        this.content = content;
    }

    // Getters and Setters
    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
