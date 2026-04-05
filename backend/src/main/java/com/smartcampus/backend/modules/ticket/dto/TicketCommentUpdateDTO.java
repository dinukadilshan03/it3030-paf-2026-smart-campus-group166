//Used for updating existing ticket comments.
package com.smartcampus.backend.modules.ticket.dto;

import jakarta.validation.constraints.NotBlank;

public class TicketCommentUpdateDTO {

    @NotBlank(message = "Comment content is required")
    private String content;

    // Constructors
    public TicketCommentUpdateDTO() {}

    public TicketCommentUpdateDTO(String content) {
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
