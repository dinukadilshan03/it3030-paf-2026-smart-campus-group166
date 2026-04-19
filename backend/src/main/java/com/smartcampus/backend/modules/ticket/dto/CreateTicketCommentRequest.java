package com.smartcampus.backend.modules.ticket.dto;

import com.smartcampus.backend.common.enums.CommentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateTicketCommentRequest(
        // Comment text is required and cannot be blank
        @NotBlank(message = "Comment body is required") String body,

        // Comment type is required to determine how the comment is handled
        @NotNull(message = "Comment type is required") CommentType commentType,

        // Optional parent comment ID for reply-style comments
        Long parentCommentId) {}