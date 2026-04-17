package com.smartcampus.backend.modules.ticket.service;

import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.exception.DuplicateResourceException;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.common.service.StoredObjectContent;
import com.smartcampus.backend.common.service.SupabaseStorageService;
import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentResponse;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketAttachment;
import com.smartcampus.backend.modules.ticket.mapper.TicketMapper;
import com.smartcampus.backend.modules.ticket.repository.TicketAttachmentRepository;
import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class TicketAttachmentService {

    private static final int MAX_ATTACHMENTS = 3;
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_MIME_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final TicketAttachmentRepository ticketAttachmentRepository;
    private final TicketAccessService ticketAccessService;
    private final TicketMapper ticketMapper;
    private final SupabaseStorageService supabaseStorageService;

    @Value("${app.supabase.storage.ticket-attachments-bucket:ticket-attachments}")
    private String ticketAttachmentsBucket;

    @Transactional(readOnly = true)
    public List<TicketAttachmentResponse> getAttachments(Ticket ticket) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        ticketAccessService.ensureCanViewTicket(membership, ticket);

        return ticketAttachmentRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId()).stream()
                .map(ticketMapper::toAttachmentResponse)
                .toList();
    }

    @Transactional
    public TicketAttachmentResponse addAttachment(Ticket ticket, String title, MultipartFile file) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        ticketAccessService.ensureCanManageAttachments(membership, ticket);

        if (ticketAttachmentRepository.countByTicket_Id(ticket.getId()) >= MAX_ATTACHMENTS) {
            throw new IllegalArgumentException("A ticket can have at most 3 attachments");
        }

        ValidatedUpload upload = validateUpload(file);
        String normalizedTitle = resolveAttachmentTitle(title, upload.originalFileName());
        String storageBucket = normalizeRequiredBucket();
        String storagePath = buildStoragePath(ticket, upload.originalFileName());
        byte[] content = readFileContent(upload.file());

        supabaseStorageService.uploadObject(storageBucket, storagePath, content, upload.mimeType());

        TicketAttachment attachment =
                TicketAttachment.builder()
                        .ticket(ticket)
                        .uploadedByUser(membership.getUser())
                        .title(normalizedTitle)
                        .fileName(upload.originalFileName())
                        .storageBucket(storageBucket)
                        .storagePath(storagePath)
                        .mimeType(upload.mimeType())
                        .fileSize(upload.fileSize())
                        .build();

        try {
            return ticketMapper.toAttachmentResponse(ticketAttachmentRepository.save(attachment));
        } catch (DataIntegrityViolationException ex) {
            tryDeleteUploadedObject(storageBucket, storagePath);
            throw new DuplicateResourceException("Attachment storage path already exists");
        } catch (RuntimeException ex) {
            tryDeleteUploadedObject(storageBucket, storagePath);
            throw new IllegalStateException("Could not save the attachment image.");
        }
    }

    @Transactional
    public void deleteAttachment(Long ticketId, Long attachmentId, Ticket ticket) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        ticketAccessService.ensureCanManageAttachments(membership, ticket);

        TicketAttachment attachment =
                ticketAttachmentRepository
                        .findByIdAndTicketId(attachmentId, ticketId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Attachment not found for ticket id: " + ticketId));
        supabaseStorageService.deleteObject(attachment.getStorageBucket(), attachment.getStoragePath());
        ticketAttachmentRepository.delete(attachment);
    }

    @Transactional(readOnly = true)
    public StoredObjectContent getAttachmentContent(Long ticketId, Long attachmentId, Ticket ticket) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        ticketAccessService.ensureCanViewTicket(membership, ticket);

        TicketAttachment attachment =
                ticketAttachmentRepository
                        .findByIdAndTicketId(attachmentId, ticketId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Attachment not found for ticket id: " + ticketId));

        return supabaseStorageService.downloadObject(
                attachment.getStorageBucket(), attachment.getStoragePath());
    }

    @Transactional
    public void deleteAllForTicket(Ticket ticket) {
        List<TicketAttachment> attachments =
                ticketAttachmentRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId());
        attachments.forEach(
                attachment ->
                        supabaseStorageService.deleteObject(
                                attachment.getStorageBucket(), attachment.getStoragePath()));
        if (!attachments.isEmpty()) {
            ticketAttachmentRepository.deleteAll(attachments);
            ticketAttachmentRepository.flush();
        }
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String resolveAttachmentTitle(String value, String originalFileName) {
        String trimmed = normalizeOptionalText(value);
        if (trimmed != null) {
            return trimToMaxLength(trimmed, 160);
        }

        String derivedTitle = normalizeOptionalText(originalFileName.replaceFirst("\\.[^.]+$", ""));
        if (derivedTitle == null) {
            return "Attachment image";
        }

        return trimToMaxLength(derivedTitle.replaceAll("[-_]+", " "), 160);
    }

    private String normalizeRequiredBucket() {
        String trimmed = normalizeOptionalText(ticketAttachmentsBucket);
        if (trimmed == null) {
            throw new IllegalStateException("Ticket image uploads are not configured.");
        }
        return trimmed;
    }

    private ValidatedUpload validateUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Attachment image is required");
        }

        String mimeType = normalizeOptionalText(file.getContentType());
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException(
                    "Only JPG, PNG, WEBP, and GIF images are allowed");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("Attachment image must be 5 MB or smaller");
        }

        String originalFileName = normalizeOptionalText(file.getOriginalFilename());
        if (originalFileName == null) {
            throw new IllegalArgumentException("Attachment file name is missing");
        }

        return new ValidatedUpload(file, originalFileName, mimeType, file.getSize());
    }

    private byte[] readFileContent(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException ex) {
            throw new IllegalStateException("Could not read the attachment image.");
        }
    }

    private String buildStoragePath(Ticket ticket, String originalFileName) {
        String extension = extractExtension(originalFileName);
        String baseName = sanitizePathSegment(originalFileName.replaceFirst("\\.[^.]+$", ""));
        String safeBaseName = baseName.isBlank() ? "attachment" : baseName;
        return "tickets/%s/%s-%s%s"
                .formatted(
                        sanitizePathSegment(ticket.getTicketNumber()),
                        UUID.randomUUID(),
                        safeBaseName,
                        extension);
    }

    private String extractExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
            return "";
        }
        String extension = fileName.substring(dotIndex).toLowerCase(Locale.ROOT);
        return extension.matches("\\.[a-z0-9]{1,10}") ? extension : "";
    }

    private String sanitizePathSegment(String value) {
        return value.replaceAll("[^A-Za-z0-9_-]+", "-").replaceAll("(^-+|-+$)", "");
    }

    private String trimToMaxLength(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private void tryDeleteUploadedObject(String bucket, String path) {
        try {
            supabaseStorageService.deleteObject(bucket, path);
        } catch (RuntimeException ignored) {
            // Best effort cleanup if persistence fails after upload.
        }
    }

    private record ValidatedUpload(
            MultipartFile file, String originalFileName, String mimeType, long fileSize) {}
}
