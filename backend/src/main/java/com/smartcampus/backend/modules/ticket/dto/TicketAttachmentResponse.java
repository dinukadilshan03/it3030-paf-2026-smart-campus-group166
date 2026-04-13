package com.smartcampus.backend.modules.ticket.dto;

import java.time.LocalDateTime;

public record TicketAttachmentResponse(
        Long id,
        Long uploadedByUserId,
        String uploadedByDisplayName,
        String fileName,
        String storageBucket,
        String storagePath,
        String mimeType,
        Long fileSize,
        String attachmentType,
        LocalDateTime createdAt) {}
