package com.smartcampus.backend.modules.ticket.entity;

// Base entity that likely provides common audit fields such as createdAt and updatedAt
import com.smartcampus.backend.common.entity.AuditableEntity;

// User entity used to identify the author of the comment
import com.smartcampus.backend.common.entity.User;

// Enum used to represent the type of comment
// Example: user comment, system comment, internal note, etc.
import com.smartcampus.backend.common.enums.CommentType;

// JPA annotations used to map this class to a database table
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

// Lombok annotations used to reduce boilerplate code
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity // Marks this class as a JPA entity, so it is mapped to a database table
@Table(name = "ticket_comments") // Maps this entity to the "ticket_comments" table
@Getter // Lombok generates getter methods for all fields
@Setter // Lombok generates setter methods for all fields
@NoArgsConstructor // Lombok generates a no-arguments constructor
@AllArgsConstructor // Lombok generates an all-arguments constructor
@Builder // Lombok enables builder pattern for object creation
public class TicketComment extends AuditableEntity {

    @Id // Marks this field as the primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-generates ID using database identity/auto-increment
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    // Many comments can belong to one ticket
    // This creates a foreign key column named ticket_id
    // optional = false means every comment must belong to a ticket
    // LAZY loading means the ticket is loaded only when needed
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_user_id", nullable = false)
    // Many comments can be written by one user
    // This stores the author of the comment
    // optional = false means every comment must have an author
    private User authorUser;

    @Column(name = "body", nullable = false)
    // Main text content of the comment
    // Required field
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(name = "comment_type", nullable = false, length = 30)
    // Stores the comment type as a readable string in the database
    // Example: USER, STAFF_NOTE, SYSTEM
    // EnumType.STRING is safer and more readable than ordinal numbers
    private CommentType commentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    // Self-referencing relationship
    // A comment can optionally point to another comment as its parent
    // This supports reply/threaded comment structures
    // It is optional because top-level comments will not have a parent
    private TicketComment parentComment;

    @Column(name = "is_edited", nullable = false)
    @Builder.Default
    // Indicates whether the comment has been edited after creation
    // true  = comment was edited
    // false = original version
    // Default is false for a new comment
    private Boolean isEdited = false;

    @Column(name = "edited_at")
    // Timestamp storing when the comment was edited
    // This can be null if the comment has never been edited
    private LocalDateTime editedAt;
}