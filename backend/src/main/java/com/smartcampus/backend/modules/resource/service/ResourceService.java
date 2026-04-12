package com.smartcampus.backend.modules.resource.service;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.exception.DuplicateResourceException;
import com.smartcampus.backend.common.exception.ResourceConflictException;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.common.enums.ResourceStatus;
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
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final ResourceAvailabilityWindowRepository resourceAvailabilityWindowRepository;
    private final ResourceCategoryService resourceCategoryService;
    private final LocationService locationService;
    private final CurrentUserService currentUserService;
    private final ResourceMapper resourceMapper;
    private final EntityManager entityManager;

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

        resourceAvailabilityWindowRepository.deleteByResource_Id(id);
        resourceRepository.delete(resource);
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
}
