package com.smartcampus.backend.modules.ticket.entity;

// User entity used to track which user uploaded the attachment
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
@Table(name = "ticket_attachments") // Maps this entity to the "ticket_attachments" table
@Getter // Lombok generates getter methods
@Setter // Lombok generates setter methods
@NoArgsConstructor // Lombok generates a no-arguments constructor
@AllArgsConstructor // Lombok generates an all-arguments constructor
@Builder // Lombok enables builder pattern for object creation
public class TicketAttachment {

    @Id // Marks this field as the primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-generates ID using database identity/auto-increment
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    // Many attachments can belong to one ticket
    // This creates a foreign key column named ticket_id
    // optional = false means every attachment must belong to a ticket
    // LAZY loading means the ticket entity is loaded only when needed
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by_user_id", nullable = false)
    // Many attachments can be uploaded by one user
    // This stores which user uploaded the attachment
    // optional = false means every attachment must have an uploader
    private User uploadedByUser;

    @Column(name = "file_name", nullable = false)
    // Original file name of the uploaded attachment
    // Required field
    private String fileName;

    @Column(name = "title", nullable = false, length = 160)
    // Title or label for the attachment
    // Required field and limited to 160 characters
    private String title;

    @Column(name = "storage_bucket", nullable = false, length = 100)
    // Name of the storage bucket where the file is stored
    // Required field
    private String storageBucket;

    @Column(name = "storage_path", nullable = false, unique = true, length = 500)
    // Full storage path/key of the file inside the storage system
    // Required field
    // unique = true ensures no two attachments point to the exact same stored path
    private String storagePath;

    @Column(name = "mime_type", length = 120)
    // MIME type of the file
    // Example: image/png, image/jpeg, application/pdf
    private String mimeType;

    @Column(name = "file_size", nullable = false)
    // Size of the uploaded file in bytes
    // Required field
    private Long fileSize;

    @Column(name = "attachment_type", length = 50)
    // Logical type/category of the attachment
    // Example: image, screenshot, document, evidence
    private String attachmentType;

    @Column(name = "created_at", nullable = false, updatable = false)
    // Timestamp when the attachment record was created
    // nullable = false means it must always have a value
    // updatable = false means once set, it should not be changed later
    private LocalDateTime createdAt;

    @PrePersist
    // This lifecycle callback runs automatically before the entity is first saved
    // It is used to set createdAt if it was not already provided
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}