package com.smartcampus.backend.modules.ticket.dto;

// Imports LocalDateTime to store the date and time when the attachment was created
import java.time.LocalDateTime;

// This is a response DTO used to send ticket attachment details
// from the backend to the frontend
public record TicketAttachmentResponse(

        // Unique ID of the attachment record
        Long id,

        // ID of the user who uploaded the attachment
        Long uploadedByUserId,

        // Display name of the user who uploaded the attachment
        String uploadedByDisplayName,

        // Optional title given to the attachment
        String title,

        // Original file name of the uploaded attachment
        String fileName,

        // Name of the storage bucket where the file is stored
        // Example: cloud bucket / object storage bucket
        String storageBucket,

        // Internal storage path of the file inside the bucket/storage
        String storagePath,

        // MIME type of the file
        // Example: image/png, image/jpeg, application/pdf
        String mimeType,

        // File size in bytes
        Long fileSize,

        // Type/category of the attachment
        // Example: image, document, screenshot, evidence, etc.
        String attachmentType,

        // Date and time when the attachment was created/uploaded
        LocalDateTime createdAt) {}