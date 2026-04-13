package com.smartcampus.backend.modules.resource.service;

import com.smartcampus.backend.common.exception.DuplicateResourceException;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.common.exception.ResourceConflictException;
import com.smartcampus.backend.modules.resource.dto.CreateResourceCategoryRequest;
import com.smartcampus.backend.modules.resource.dto.ResourceCategoryDetailResponse;
import com.smartcampus.backend.modules.resource.dto.ResourceCategorySummaryResponse;
import com.smartcampus.backend.modules.resource.dto.UpdateResourceCategoryRequest;
import com.smartcampus.backend.modules.resource.entity.ResourceCategory;
import com.smartcampus.backend.modules.resource.mapper.ResourceMapper;
import com.smartcampus.backend.modules.resource.repository.ResourceCategoryRepository;
import com.smartcampus.backend.modules.resource.repository.ResourceRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ResourceCategoryService {

    private final ResourceCategoryRepository resourceCategoryRepository;
    private final ResourceRepository resourceRepository;
    private final ResourceMapper resourceMapper;

    @Transactional(readOnly = true)
    public List<ResourceCategorySummaryResponse> getAll() {
        return resourceCategoryRepository.findAll().stream()
                .sorted(java.util.Comparator.comparing(ResourceCategory::getName, String.CASE_INSENSITIVE_ORDER))
                .map(resourceMapper::toCategorySummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public ResourceCategoryDetailResponse getById(Long id) {
        return resourceMapper.toCategoryDetail(getManagedCategory(id));
    }

    @Transactional
    public ResourceCategoryDetailResponse create(CreateResourceCategoryRequest request) {
        validateUniqueCode(request.code(), null);

        ResourceCategory category =
                ResourceCategory.builder()
                        .code(normalizeCode(request.code()))
                        .name(request.name().trim())
                        .description(request.description())
                        .isActive(request.isActive() == null ? true : request.isActive())
                        .build();

        return resourceMapper.toCategoryDetail(resourceCategoryRepository.save(category));
    }

    @Transactional
    public ResourceCategoryDetailResponse update(Long id, UpdateResourceCategoryRequest request) {
        ResourceCategory category = getManagedCategory(id);
        if (request.code() != null) {
            validateRequiredText(request.code(), "Category code");
            validateUniqueCode(request.code(), id);
            category.setCode(normalizeCode(request.code()));
        }
        if (request.name() != null) {
            validateRequiredText(request.name(), "Category name");
            category.setName(request.name().trim());
        }
        if (request.description() != null) {
            category.setDescription(request.description());
        }
        if (request.isActive() != null) {
            category.setIsActive(request.isActive());
        }

        return resourceMapper.toCategoryDetail(resourceCategoryRepository.save(category));
    }

    @Transactional
    public void delete(Long id) {
        ResourceCategory category = getManagedCategory(id);
        if (resourceRepository.existsByResourceCategory_Id(id)) {
            throw new ResourceConflictException(
                    "Cannot delete category while resources still reference it");
        }
        resourceCategoryRepository.delete(category);
    }

    public ResourceCategory getManagedCategory(Long id) {
        return resourceCategoryRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource category not found for id: " + id));
    }

    private void validateUniqueCode(String code, Long currentId) {
        resourceCategoryRepository
                .findByCodeIgnoreCase(code.trim())
                .filter(existing -> !existing.getId().equals(currentId))
                .ifPresent(
                        existing -> {
                            throw new DuplicateResourceException("Resource category code already exists");
                        });
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase();
    }

    private void validateRequiredText(String value, String label) {
        if (value.isBlank()) {
            throw new IllegalArgumentException(label + " cannot be blank");
        }
    }
}
