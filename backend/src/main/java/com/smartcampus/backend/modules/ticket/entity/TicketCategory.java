package com.smartcampus.backend.modules.ticket.entity;

// Base entity that likely provides common audit fields such as createdAt and updatedAt
import com.smartcampus.backend.common.entity.AuditableEntity;

// JPA annotations used to map this class to a database table
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

// Lombok annotations used to reduce boilerplate code
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity // Marks this class as a JPA entity, so it is mapped to a database table
@Table(name = "ticket_categories") // Maps this entity to the "ticket_categories" table
@Getter // Lombok generates getter methods for all fields
@Setter // Lombok generates setter methods for all fields
@NoArgsConstructor // Lombok generates a no-arguments constructor
@AllArgsConstructor // Lombok generates an all-arguments constructor
@Builder // Lombok enables builder pattern for creating objects
public class TicketCategory extends AuditableEntity {

    @Id // Marks this field as the primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-generates ID using database identity/auto-increment
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    // Unique short code for the category
    // Example: HARDWARE, NETWORK, SOFTWARE
    // nullable = false means every category must have a code
    // unique = true means no two categories can have the same code
    // length = 50 limits the database column size
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    // Human-readable category name
    // Example: Hardware Issue, Network Problem
    // Required field and limited to 100 characters
    private String name;

    @Column(name = "description")
    // Optional description explaining what this category is used for
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    // Indicates whether the category is currently active
    // true  = category can be used when creating or updating tickets
    // false = category is disabled/inactive
    // Default value is true
    private Boolean isActive = true;
}