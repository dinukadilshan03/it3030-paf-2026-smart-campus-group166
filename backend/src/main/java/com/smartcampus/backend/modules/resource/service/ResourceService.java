package com.smartcampus.backend.modules.resource.service;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.exception.DuplicateResourceException;
import com.smartcampus.backend.common.exception.ResourceConflictException;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.common.enums.ResourceStatus;
import com.smartcampus.backend.common.service.StoredObjectContent;
import com.smartcampus.backend.common.service.SupabaseStorageService;
import com.smartcampus.backend.modules.auth.service.CurrentUserService;
import com.smartcampus.backend.modules.resource.dto.CreateResourceRequest;
import com.smartcampus.backend.modules.resource.dto.ResourceDetailResponse;
import com.smartcampus.backend.modules.resource.dto.ResourceSummaryResponse;
import com.smartcampus.backend.modules.resource.dto.UpdateResourceRequest;
import com.smartcampus.backend.modules.resource.entity.Resource;
import com.smartcampus.backend.modules.resource.entity.ResourceCategory;
import com.smartcampus.backend.modules.resource.entity.Location;
import com.smartcampus.backend.modules.resource.mapper.ResourceMapper;
import com.smartcampus.backend.modules.resource.repository.ResourceAvailabilityWindowRepository;
import com.smartcampus.backend.modules.resource.repository.ResourceRepository;
import jakarta.persistence.EntityManager;
import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private static final String STORED_IMAGE_PREFIX = "resource-image:";
    private static final String STORED_IMAGE_BUCKET_DELIMITER = "|";
    private static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_IMAGE_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final ResourceRepository resourceRepository;
    private final ResourceAvailabilityWindowRepository resourceAvailabilityWindowRepository;
    private final ResourceCategoryService resourceCategoryService;
    private final LocationService locationService;
    private final CurrentUserService currentUserService;
    private final ResourceMapper resourceMapper;
    private final EntityManager entityManager;
    private final SupabaseStorageService storageService;

    @Value("${app.supabase.storage.resource-images-bucket:resource-images}")
    private String resourceImagesBucket;

    @Transactional(readOnly = true)
    public List<ResourceSummaryResponse> getResources(
            Long categoryId,
            Long locationId,
            ResourceStatus status,
            Integer minCapacity,
            String search) {
        return resourceRepository
                .searchResources(
                        categoryId, locationId, status, minCapacity, normalizeSearch(search))
                .stream()
                .map(resourceMapper::toResourceSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public ResourceDetailResponse getResourceById(Long id) {
        return resourceMapper.toResourceDetail(getDetailedResource(id));
    }

    @Transactional
    public ResourceDetailResponse create(CreateResourceRequest request) {
        validateUniqueCode(request.resourceCode(), null);

        ResourceCategory category =
                resourceCategoryService.getManagedCategory(request.resourceCategoryId());
        Location location = locationService.getManagedLocation(request.locationId());
        User actingUser = getAuthenticatedUser();

        Resource resource =
                Resource.builder()
                        .resourceCategory(category)
                        .location(location)
                        .resourceCode(normalizeCode(request.resourceCode()))
                        .name(request.name().trim())
                        .description(normalizeOptionalText(request.description()))
                        .capacity(request.capacity())
                        .status(request.status())
                        .requiresApproval(
                                request.requiresApproval() == null ? true : request.requiresApproval())
                        .notes(normalizeOptionalText(request.notes()))
                        .imageUrl(normalizeOptionalText(request.imageUrl()))
                        .createdByUser(actingUser)
                        .updatedByUser(actingUser)
                        .build();

        return resourceMapper.toResourceDetail(resourceRepository.save(resource));
    }

    @Transactional
    public ResourceDetailResponse update(Long id, UpdateResourceRequest request) {
        Resource resource = getManagedResource(id);

        if (request.resourceCategoryId() != null) {
            resource.setResourceCategory(
                    resourceCategoryService.getManagedCategory(request.resourceCategoryId()));
        }
        if (request.locationId() != null) {
            resource.setLocation(locationService.getManagedLocation(request.locationId()));
        }
        if (request.resourceCode() != null) {
            validateRequiredText(request.resourceCode(), "Resource code");
            validateUniqueCode(request.resourceCode(), id);
            resource.setResourceCode(normalizeCode(request.resourceCode()));
        }
        if (request.name() != null) {
            validateRequiredText(request.name(), "Resource name");
            resource.setName(request.name().trim());
        }
        if (request.description() != null) {
            resource.setDescription(normalizeOptionalText(request.description()));
        }
        if (request.capacity() != null) {
            resource.setCapacity(request.capacity());
        }
        if (request.status() != null) {
            resource.setStatus(request.status());
        }
        if (request.requiresApproval() != null) {
            resource.setRequiresApproval(request.requiresApproval());
        }
        if (request.notes() != null) {
            resource.setNotes(normalizeOptionalText(request.notes()));
        }
        if (request.imageUrl() != null) {
            resource.setImageUrl(normalizeOptionalText(request.imageUrl()));
        }

        resource.setUpdatedByUser(getAuthenticatedUser());
        return resourceMapper.toResourceDetail(resourceRepository.save(resource));
    }

    @Transactional
    public void delete(Long id) {
        Resource resource = getManagedResource(id);

        Long bookingCount =
                entityManager
                        .createQuery(
                                "select count(b) from Booking b where b.resource.id = :resourceId",
                                Long.class)
                        .setParameter("resourceId", id)
                        .getSingleResult();
        if (bookingCount > 0) {
            throw new ResourceConflictException(
                    "Cannot delete resource while bookings still reference it");
        }

        Long ticketCount =
                entityManager
                        .createQuery(
                                "select count(t) from Ticket t where t.resource.id = :resourceId",
                                Long.class)
                        .setParameter("resourceId", id)
                        .getSingleResult();
        if (ticketCount > 0) {
            throw new ResourceConflictException(
                    "Cannot delete resource while tickets still reference it");
        }

        deleteStoredImageIfPresent(resource);
        resourceAvailabilityWindowRepository.deleteByResource_Id(id);
        resourceRepository.delete(resource);
    }

    @Transactional
    public ResourceDetailResponse uploadImage(Long id, MultipartFile file) {
        Resource resource = getManagedResource(id);
        ValidatedImageUpload upload = validateImageUpload(file);
        String storageBucket = normalizeRequiredBucket();
        String storagePath = buildStoragePath(id, upload.originalFileName());
        byte[] content = readFileContent(upload.file());

        storageService.uploadObject(storageBucket, storagePath, content, upload.contentType());

        StoredImageReference previousStoredImageReference =
                extractStoredImageReference(resource.getImageUrl());
        resource.setImageUrl(buildStoredImageReference(storageBucket, storagePath));
        resource.setUpdatedByUser(getAuthenticatedUser());

        Resource savedResource;
        try {
            savedResource = resourceRepository.save(resource);
        } catch (RuntimeException ex) {
            tryDeleteUploadedObject(storageBucket, storagePath);
            throw new IllegalStateException("Could not save the resource image.");
        }

        if (previousStoredImageReference != null) {
            tryDeleteUploadedObject(
                    previousStoredImageReference.bucket(), previousStoredImageReference.path());
        }

        return resourceMapper.toResourceDetail(savedResource);
    }

    @Transactional(readOnly = true)
    public StoredObjectContent getImageContent(Long id) {
        Resource resource = getManagedResource(id);
        StoredImageReference storedImageReference = extractStoredImageReference(resource.getImageUrl());
        if (storedImageReference == null) {
            throw new ResourceNotFoundException("Resource image not found for id: " + id);
        }

        return storageService.downloadObject(
                storedImageReference.bucket(), storedImageReference.path());
    }

    @Transactional(readOnly = true)
    public Resource getManagedResource(Long id) {
        return resourceRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found for id: " + id));
    }

    @Transactional(readOnly = true)
    public Resource getDetailedResource(Long id) {
        return resourceRepository
                .findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found for id: " + id));
    }

    private void validateUniqueCode(String resourceCode, Long currentId) {
        resourceRepository
                .findByResourceCodeIgnoreCase(resourceCode.trim())
                .filter(existing -> !existing.getId().equals(currentId))
                .ifPresent(
                        existing -> {
                            throw new DuplicateResourceException("Resource code already exists");
                        });
    }

    private User getAuthenticatedUser() {
        return currentUserService
                .getCurrentUserRole()
                .map(userRole -> userRole.getUser())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user context is required"));
    }

    private String normalizeCode(String resourceCode) {
        return resourceCode.trim().toUpperCase();
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void validateRequiredText(String value, String label) {
        if (value.isBlank()) {
            throw new IllegalArgumentException(label + " cannot be blank");
        }
    }

    private String normalizeSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        return search.trim().toLowerCase();
    }

    private void deleteStoredImageIfPresent(Resource resource) {
        StoredImageReference storedImageReference = extractStoredImageReference(resource.getImageUrl());
        if (storedImageReference == null) {
            return;
        }
        tryDeleteUploadedObject(storedImageReference.bucket(), storedImageReference.path());
    }

    private void tryDeleteUploadedObject(String bucket, String storagePath) {
        try {
            storageService.deleteObject(bucket, storagePath);
        } catch (RuntimeException ignored) {
            // Best effort cleanup so resource CRUD failures are still surfaced consistently.
        }
    }

    private String normalizeRequiredBucket() {
        String trimmed = normalizeOptionalText(resourceImagesBucket);
        if (trimmed == null) {
            throw new IllegalStateException("Resource image uploads are not configured.");
        }
        return trimmed;
    }

    private ValidatedImageUpload validateImageUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Resource image is required");
        }

        String contentType = normalizeOptionalText(file.getContentType());
        if (contentType == null
                || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Only JPG, PNG, WEBP, and GIF images are allowed");
        }

        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("Resource image must be 5 MB or smaller");
        }

        String originalFileName = normalizeOptionalText(file.getOriginalFilename());
        if (originalFileName == null) {
            throw new IllegalArgumentException("Resource image file name is required");
        }

        return new ValidatedImageUpload(file, contentType, originalFileName);
    }

    private byte[] readFileContent(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException ex) {
            throw new IllegalStateException("Could not read the resource image.");
        }
    }

    private String buildStoragePath(Long resourceId, String originalFileName) {
        String sanitizedFileName =
                originalFileName
                        .replace('\\', '/')
                        .replaceAll("^.*?/", "")
                        .replaceAll("[^A-Za-z0-9._-]", "-");
        String extension = sanitizedFileName.contains(".")
                ? sanitizedFileName.substring(sanitizedFileName.lastIndexOf('.'))
                : "";
        return "resources/%d/%s%s".formatted(resourceId, UUID.randomUUID(), extension);
    }

    private String buildStoredImageReference(String bucket, String storagePath) {
        return STORED_IMAGE_PREFIX + bucket + STORED_IMAGE_BUCKET_DELIMITER + storagePath;
    }

    private StoredImageReference extractStoredImageReference(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith(STORED_IMAGE_PREFIX)) {
            return null;
        }

        String storedReference = imageUrl.substring(STORED_IMAGE_PREFIX.length()).trim();
        if (storedReference.isEmpty()) {
            return null;
        }

        int delimiterIndex = storedReference.indexOf(STORED_IMAGE_BUCKET_DELIMITER);
        if (delimiterIndex < 0) {
            return new StoredImageReference(normalizeRequiredBucket(), storedReference);
        }

        String bucket = normalizeOptionalText(storedReference.substring(0, delimiterIndex));
        String storagePath =
                normalizeOptionalText(
                        storedReference.substring(
                                delimiterIndex + STORED_IMAGE_BUCKET_DELIMITER.length()));
        if (bucket == null || storagePath == null) {
            return null;
        }

        return new StoredImageReference(bucket, storagePath);
    }

    private record ValidatedImageUpload(
            MultipartFile file, String contentType, String originalFileName) {}

    private record StoredImageReference(String bucket, String path) {}
}
