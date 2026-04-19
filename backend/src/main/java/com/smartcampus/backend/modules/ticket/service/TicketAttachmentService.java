package com.smartcampus.backend.modules.ticket.service;

// UserRole contains the current authenticated user's membership/role context
import com.smartcampus.backend.common.entity.UserRole;

// Custom exception used when a duplicate resource conflict happens
import com.smartcampus.backend.common.exception.DuplicateResourceException;

// Custom exception used when a requested resource does not exist
import com.smartcampus.backend.common.exception.ResourceNotFoundException;

// Wrapper object used when downloading stored file content
import com.smartcampus.backend.common.service.StoredObjectContent;

// Service used to upload, download, and delete files from Supabase storage
import com.smartcampus.backend.common.service.SupabaseStorageService;

// Response DTO returned to the frontend for attachment metadata
import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentResponse;

// Ticket entity used as the parent object for attachments
import com.smartcampus.backend.modules.ticket.entity.Ticket;

// Attachment entity stored in the database
import com.smartcampus.backend.modules.ticket.entity.TicketAttachment;

// Mapper used to convert entity objects into response DTOs
import com.smartcampus.backend.modules.ticket.mapper.TicketMapper;

// Repository used for attachment database operations
import com.smartcampus.backend.modules.ticket.repository.TicketAttachmentRepository;

import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

// Lombok annotation used for constructor injection
import lombok.RequiredArgsConstructor;

// Injects property value from application configuration
import org.springframework.beans.factory.annotation.Value;

// Exception thrown when a database unique constraint or integrity rule is violated
import org.springframework.dao.DataIntegrityViolationException;

// Marks this class as a Spring service bean
import org.springframework.stereotype.Service;

// Transaction management annotations
import org.springframework.transaction.annotation.Transactional;

// Represents an uploaded multipart file from an HTTP request
import org.springframework.web.multipart.MultipartFile;

@Service // Registers this class as a Spring service
@RequiredArgsConstructor // Generates constructor injection for final fields
public class TicketAttachmentService {

    // Maximum number of attachments allowed per ticket
    private static final int MAX_ATTACHMENTS = 3;

    // Maximum allowed file size = 5 MB
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024L * 1024L;

    // Allowed MIME types for uploaded attachment images
    private static final Set<String> ALLOWED_MIME_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    // Repository used for attachment persistence
    private final TicketAttachmentRepository ticketAttachmentRepository;

    // Access service used to enforce ticket permissions
    private final TicketAccessService ticketAccessService;

    // Mapper used to convert attachment entities into response DTOs
    private final TicketMapper ticketMapper;

    // Storage service used to upload/download/delete files in Supabase storage
    private final SupabaseStorageService supabaseStorageService;

    // Bucket name used for ticket attachment storage
    // If no property is configured, it defaults to "ticket-attachments"
    @Value("${app.supabase.storage.ticket-attachments-bucket:ticket-attachments}")
    private String ticketAttachmentsBucket;

    // Returns all attachments for a ticket
    //
    // Steps:
    // 1. get current authenticated membership
    // 2. verify the user can view the ticket
    // 3. fetch attachments ordered by upload time
    // 4. map each entity to a response DTO
    @Transactional(readOnly = true)
    public List<TicketAttachmentResponse> getAttachments(Ticket ticket) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        ticketAccessService.ensureCanViewTicket(membership, ticket);

        return ticketAttachmentRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId()).stream()
                .map(ticketMapper::toAttachmentResponse)
                .toList();
    }

    // Adds a new attachment to a ticket
    //
    // Steps:
    // 1. get current authenticated membership
    // 2. verify the user can manage attachments for this ticket
    // 3. enforce max attachment count
    // 4. validate file type, size, and original name
    // 5. resolve title
    // 6. resolve storage bucket and path
    // 7. read file bytes
    // 8. upload file to Supabase storage
    // 9. save metadata in the database
    // 10. map saved entity to response DTO
    //
    // If DB save fails after upload, uploaded file is cleaned up as best effort
    @Transactional
    public TicketAttachmentResponse addAttachment(Ticket ticket, String title, MultipartFile file) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        ticketAccessService.ensureCanManageAttachments(membership, ticket);

        // Enforce assignment/business rule: a ticket can only have up to 3 attachments
        if (ticketAttachmentRepository.countByTicket_Id(ticket.getId()) >= MAX_ATTACHMENTS) {
            throw new IllegalArgumentException("A ticket can have at most 3 attachments");
        }

        // Validate upload file and extract safe metadata
        ValidatedUpload upload = validateUpload(file);

        // Resolve attachment title:
        // - use provided title if present
        // - otherwise derive title from original file name
        String normalizedTitle = resolveAttachmentTitle(title, upload.originalFileName());

        // Resolve configured storage bucket
        String storageBucket = normalizeRequiredBucket();

        // Build a safe unique storage path
        String storagePath = buildStoragePath(ticket, upload.originalFileName());

        // Read file bytes
        byte[] content = readFileContent(upload.file());

        // Upload actual file to object storage
        supabaseStorageService.uploadObject(storageBucket, storagePath, content, upload.mimeType());

        // Build attachment entity metadata for persistence
        TicketAttachment attachment =
                TicketAttachment.builder()
                        .ticket(ticket) // parent ticket
                        .uploadedByUser(membership.getUser()) // current uploader
                        .title(normalizedTitle) // resolved title
                        .fileName(upload.originalFileName()) // original file name
                        .storageBucket(storageBucket) // storage bucket
                        .storagePath(storagePath) // unique storage key/path
                        .mimeType(upload.mimeType()) // MIME type
                        .fileSize(upload.fileSize()) // file size in bytes
                        .build();

        try {
            // Save metadata and return mapped DTO
            return ticketMapper.toAttachmentResponse(ticketAttachmentRepository.save(attachment));
        } catch (DataIntegrityViolationException ex) {
            // If save fails because storage path or DB uniqueness conflicts,
            // delete the already uploaded file to avoid orphan objects
            tryDeleteUploadedObject(storageBucket, storagePath);
            throw new DuplicateResourceException("Attachment storage path already exists");
        } catch (RuntimeException ex) {
            // For any other runtime failure after upload, clean up storage object too
            tryDeleteUploadedObject(storageBucket, storagePath);
            throw new IllegalStateException("Could not save the attachment image.");
        }
    }

    // Deletes a specific attachment from a ticket
    //
    // Which fields are used and why:
    // - ticketId: ensures the attachment belongs to the correct parent ticket
    // - attachmentId: uniquely identifies the exact attachment to delete
    //
    // Steps:
    // 1. get current membership
    // 2. check permission to manage attachments
    // 3. load the attachment by attachmentId + ticketId
    // 4. delete file from storage
    // 5. delete metadata from database
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

    // Downloads/returns the actual stored content of an attachment
    //
    // Which fields are used and why:
    // - ticketId: validates attachment belongs to the correct ticket
    // - attachmentId: identifies the exact attachment
    //
    // Steps:
    // 1. get current membership
    // 2. verify user can view the ticket
    // 3. load attachment metadata
    // 4. download actual file bytes from storage
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

    // Deletes all attachments belonging to a ticket
    //
    // Useful when deleting a ticket or performing full cleanup
    //
    // Steps:
    // 1. fetch all attachments of the ticket
    // 2. delete every file from storage
    // 3. delete all attachment metadata from database
    // 4. flush repository to immediately apply DB deletion
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

    // Utility method:
    // trims text and converts blank strings to null
    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    // Resolves the final title for an attachment
    //
    // Priority:
    // 1. use provided title if non-blank
    // 2. otherwise derive from original file name (without extension)
    // 3. otherwise use fallback "Attachment image"
    //
    // Result is trimmed to max 160 characters
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

    // Ensures the storage bucket configuration exists and is non-blank
    private String normalizeRequiredBucket() {
        String trimmed = normalizeOptionalText(ticketAttachmentsBucket);
        if (trimmed == null) {
            throw new IllegalStateException("Ticket image uploads are not configured.");
        }
        return trimmed;
    }

    // Validates the uploaded file
    //
    // Checks:
    // - file exists and is not empty
    // - MIME type is allowed
    // - file size <= 5 MB
    // - original filename exists
    //
    // Returns a small validated record with extracted safe metadata
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

    // Reads raw bytes from MultipartFile
    // Converts checked IOException into service-level IllegalStateException
    private byte[] readFileContent(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException ex) {
            throw new IllegalStateException("Could not read the attachment image.");
        }
    }

    // Builds a safe unique storage path for the uploaded file
    //
    // Path format:
    // tickets/{ticketNumber}/{UUID}-{safeBaseName}{extension}
    //
    // Why use this:
    // - groups files under ticket number
    // - UUID prevents collisions
    // - sanitized file name makes path safer
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

    // Extracts a safe file extension from the original file name
    //
    // Rules:
    // - if no extension exists, return empty string
    // - only allow extensions matching .[a-z0-9]{1,10}
    // - lowercase the extension
    private String extractExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
            return "";
        }
        String extension = fileName.substring(dotIndex).toLowerCase(Locale.ROOT);
        return extension.matches("\\.[a-z0-9]{1,10}") ? extension : "";
    }

    // Sanitizes a path segment so only safe characters remain
    //
    // Allowed:
    // - letters
    // - numbers
    // - underscore
    // - hyphen
    //
    // Other characters are replaced with '-'
    private String sanitizePathSegment(String value) {
        return value.replaceAll("[^A-Za-z0-9_-]+", "-").replaceAll("(^-+|-+$)", "");
    }

    // Trims a string to the given maximum length
    private String trimToMaxLength(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    // Best-effort cleanup used if file upload succeeded but DB persistence failed
    //
    // Prevents orphaned files in storage
    private void tryDeleteUploadedObject(String bucket, String path) {
        try {
            supabaseStorageService.deleteObject(bucket, path);
        } catch (RuntimeException ignored) {
            // Best effort cleanup if persistence fails after upload.
        }
    }

    // Small private helper record that groups validated upload metadata
    //
    // Why useful:
    // - keeps validation output clean
    // - avoids passing many separate variables around
    private record ValidatedUpload(
            MultipartFile file, String originalFileName, String mimeType, long fileSize) {}
}