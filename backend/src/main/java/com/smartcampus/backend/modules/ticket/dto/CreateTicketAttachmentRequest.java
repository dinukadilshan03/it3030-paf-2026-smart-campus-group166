package com.smartcampus.backend.modules.ticket.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTicketAttachmentRequest(
        @NotBlank(message = "File name is required") String fileName,
        @NotBlank(message = "Storage bucket is required")
                @Size(max = 100, message = "Storage bucket must be at most 100 characters")
                String storageBucket,
        @NotBlank(message = "Storage path is required")
                @Size(max = 500, message = "Storage path must be at most 500 characters")
                String storagePath,
        @Size(max = 120, message = "Mime type must be at most 120 characters") String mimeType,
        @NotNull(message = "File size is required")
                @Min(value = 0, message = "File size must be non-negative")
                Long fileSize,
        @Size(max = 50, message = "Attachment type must be at most 50 characters")
                String attachmentType) {}
