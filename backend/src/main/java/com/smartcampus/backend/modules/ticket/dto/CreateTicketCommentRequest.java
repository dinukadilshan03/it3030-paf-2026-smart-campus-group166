package com.smartcampus.backend.modules.ticket.dto;

import com.smartcampus.backend.common.enums.CommentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateTicketCommentRequest(
        @NotBlank(message = "Comment body is required") String body,
        @NotNull(message = "Comment type is required") CommentType commentType,
        Long parentCommentId) {}
