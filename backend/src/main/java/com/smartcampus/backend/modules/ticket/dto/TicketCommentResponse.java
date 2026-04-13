package com.smartcampus.backend.modules.ticket.dto;

import com.smartcampus.backend.common.enums.CommentType;
import java.time.LocalDateTime;

public record TicketCommentResponse(
        Long id,
        Long authorUserId,
        String authorDisplayName,
        String body,
        CommentType commentType,
        Long parentCommentId,
        Boolean isEdited,
        LocalDateTime editedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {}
