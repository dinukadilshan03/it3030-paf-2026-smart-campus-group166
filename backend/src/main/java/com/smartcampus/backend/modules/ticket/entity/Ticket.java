package com.smartcampus.backend.modules.ticket.entity;

// Base entity that likely provides common audit fields such as createdAt and updatedAt
import com.smartcampus.backend.common.entity.AuditableEntity;

// User entity used for reporter and assigned staff relationships
import com.smartcampus.backend.common.entity.User;

// Enum used for ticket priority values such as LOW, MEDIUM, HIGH
import com.smartcampus.backend.common.enums.TicketPriority;

// Enum used for ticket workflow status values such as OPEN, IN_PROGRESS, RESOLVED
import com.smartcampus.backend.common.enums.TicketStatus;

// Related location entity
import com.smartcampus.backend.modules.resource.entity.Location;

// Related resource entity
import com.smartcampus.backend.modules.resource.entity.Resource;

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

@Entity // Marks this class as a JPA entity, meaning it is mapped to a database table
@Table(name = "tickets") // Maps this entity to the "tickets" table in the database
@Getter // Lombok generates getter methods for all fields
@Setter // Lombok generates setter methods for all fields
@NoArgsConstructor // Lombok generates a no-arguments constructor
@AllArgsConstructor // Lombok generates an all-arguments constructor
@Builder // Lombok enables builder pattern for creating Ticket objects
public class Ticket extends AuditableEntity {

    @Id // Marks this field as the primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-generates ID values using database identity/auto-increment
    private Long id;

    @Column(name = "ticket_number", nullable = false, unique = true, length = 40)
    // Unique human-readable ticket number, such as TCK-001
    // nullable = false means this value is required
    // unique = true means no two tickets can have the same ticket number
    // length = 40 limits the database column size
    private String ticketNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_user_id", nullable = false)
    // Many tickets can be reported by one user
    // This creates a foreign key column named reporter_user_id
    // optional = false means every ticket must have a reporter
    // LAZY loading means reporter details are loaded only when needed
    private User reporterUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_staff_user_id")
    // Many tickets can be assigned to one staff user
    // This is optional because a ticket may be unassigned at first
    private User assignedStaffUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id")
    // Many tickets can refer to the same resource
    // Optional, because some tickets may be about a location instead of a resource
    private Resource resource;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    // Many tickets can refer to the same location
    // Optional, because some tickets may be about a resource instead of a location
    private Location location;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_category_id", nullable = false)
    // Many tickets can belong to one ticket category
    // Category is required for classification
    private TicketCategory ticketCategory;

    @Column(name = "title", nullable = false, length = 200)
    // Ticket title is required and limited to 200 characters in the database
    private String title;

    @Column(name = "description", nullable = false)
    // Main description of the issue
    // Required field
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    // Stores the enum value as a readable string in the database, not as a number
    // Example: MEDIUM instead of 1
    // Default priority is MEDIUM if not explicitly set
    private TicketPriority priority = TicketPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    // Stores the ticket workflow status as a string
    // Default status is OPEN when a new ticket is created
    private TicketStatus status = TicketStatus.OPEN;

    @Column(name = "preferred_contact_name", length = 160)
    // Optional preferred contact name for follow-up communication
    private String preferredContactName;

    @Column(name = "preferred_contact_email")
    // Optional preferred contact email
    private String preferredContactEmail;

    @Column(name = "preferred_contact_phone", length = 30)
    // Optional preferred contact phone number
    private String preferredContactPhone;

    @Column(name = "resolution_summary")
    // Summary of how the issue was resolved
    // Usually filled when ticket is moved to RESOLVED
    private String resolutionSummary;

    @Column(name = "rejection_reason")
    // Reason for rejecting the ticket
    // Usually filled when ticket status becomes REJECTED
    private String rejectionReason;

    @Column(name = "first_responded_at")
    // Timestamp for the first response by staff
    private LocalDateTime firstRespondedAt;

    @Column(name = "resolved_at")
    // Timestamp when the ticket was resolved
    private LocalDateTime resolvedAt;

    @Column(name = "rejected_at")
    // Timestamp when the ticket was rejected
    private LocalDateTime rejectedAt;

    @Column(name = "closed_at")
    // Timestamp when the ticket was closed
    private LocalDateTime closedAt;

    @Column(name = "reconsideration_note")
    // Stores the user's reconsideration request note
    private String reconsiderationNote;

    @Column(name = "reconsideration_requested_at")
    // Timestamp when reconsideration was requested
    private LocalDateTime reconsiderationRequestedAt;

    @Column(name = "reconsideration_reviewed_at")
    // Timestamp when reconsideration was reviewed by staff/admin
    private LocalDateTime reconsiderationReviewedAt;

    @Column(name = "reconsideration_request_count", nullable = false)
    @Builder.Default
    // Number of times reconsideration was requested
    // Default is 0
    private Integer reconsiderationRequestCount = 0;

    @Column(name = "staff_review_count", nullable = false)
    @Builder.Default
    // Number of staff reviews on this ticket
    // Default is 0
    private Integer staffReviewCount = 0;

    @Column(name = "admin_review_count", nullable = false)
    @Builder.Default
    // Number of admin reviews on this ticket
    // Default is 0
    private Integer adminReviewCount = 0;
}