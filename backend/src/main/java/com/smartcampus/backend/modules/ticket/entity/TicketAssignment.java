package com.smartcampus.backend.modules.ticket.entity;

// User entity used for assignment relationships
import com.smartcampus.backend.common.entity.User;

// JPA annotations used to map this class to a database table
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

// Lombok annotations used to reduce boilerplate code
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity // Marks this class as a JPA entity
@Table(name = "ticket_assignments") // Maps this entity to the "ticket_assignments" table
@Getter // Lombok generates getter methods
@Setter // Lombok generates setter methods
@NoArgsConstructor // Lombok generates no-args constructor
@AllArgsConstructor // Lombok generates all-args constructor
@Builder // Lombok enables builder pattern for object creation
public class TicketAssignment {

    @Id // Marks this field as the primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-generates ID using database identity/auto-increment
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    // Many assignment records can belong to one ticket
    // This creates a foreign key column named ticket_id
    // optional = false means every assignment must belong to a ticket
    // LAZY loading means the ticket entity is loaded only when needed
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigned_to_user_id", nullable = false)
    // Many assignment records can point to one assigned user
    // This stores which user the ticket was assigned to
    // optional = false means assignment must have a target user
    private User assignedToUser;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigned_by_user_id", nullable = false)
    // Many assignment records can be created by one assigning user
    // This stores who made the assignment action
    // optional = false means assignment must always have an assigner
    private User assignedByUser;

    @Column(name = "assignment_note")
    // Optional note added during assignment
    // Can be used to give instructions or explain the reason for assignment
    private String assignmentNote;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    // Timestamp when the assignment was created
    // nullable = false means every record must have this value
    // updatable = false means once set, it should not be changed later
    private LocalDateTime assignedAt;

    @Column(name = "unassigned_at")
    // Timestamp when the assignment ended or was removed
    // This can be null while the assignment is still active
    private LocalDateTime unassignedAt;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    // Indicates whether this assignment is currently active
    // true  = current active assignment
    // false = old/inactive assignment
    // Default is true when a new assignment record is created
    private Boolean isActive = true;

    @PrePersist
    // This lifecycle callback runs automatically before the entity is first saved
    // It is used to initialize default values safely before insert
    protected void onCreate() {
        // If assignedAt was not manually set, set it to the current date and time
        if (assignedAt == null) {
            assignedAt = LocalDateTime.now();
        }

        // If isActive was not manually set, default it to true
        if (isActive == null) {
            isActive = true;
        }
    }
}