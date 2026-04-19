package com.smartcampus.backend.modules.ticket.dto;

// Imports the enum that represents the type of comment
// Example: normal comment, system comment, internal note, etc.
import com.smartcampus.backend.common.enums.CommentType;

// Imports LocalDateTime to store timestamps
import java.time.LocalDateTime;

// This is a response DTO used to send ticket comment details
// from the backend to the frontend
public record TicketCommentResponse(

        // Unique ID of the comment
        Long id,

        // ID of the user who wrote the comment
        Long authorUserId,

        // Display name of the comment author
        String authorDisplayName,

        // Main text/body of the comment
        String body,

        // Type of the comment
        // This helps identify what kind of comment it is
        CommentType commentType,

        // ID of the parent comment if this is a reply
        // Can be null if this is a top-level comment
        Long parentCommentId,

        // Indicates whether the comment has been edited after creation
        // true  = comment was edited
        // false = original version
        Boolean isEdited,

        // Date and time when the comment was edited
        // Can be null if the comment has never been edited
        LocalDateTime editedAt,

        // Date and time when the comment was first created
        LocalDateTime createdAt,

        // Date and time when the comment was last updated
        LocalDateTime updatedAt) {}