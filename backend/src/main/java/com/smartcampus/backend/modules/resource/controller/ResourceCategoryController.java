package com.smartcampus.backend.modules.resource.controller;

import com.smartcampus.backend.modules.resource.dto.CreateResourceCategoryRequest;
import com.smartcampus.backend.modules.resource.dto.ResourceCategoryDetailResponse;
import com.smartcampus.backend.modules.resource.dto.ResourceCategorySummaryResponse;
import com.smartcampus.backend.modules.resource.dto.UpdateResourceCategoryRequest;
import com.smartcampus.backend.modules.resource.service.ResourceCategoryService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/resource-categories")
@RequiredArgsConstructor
public class ResourceCategoryController {

    private final ResourceCategoryService resourceCategoryService;

    @GetMapping
    public List<ResourceCategorySummaryResponse> getResourceCategories() {
        return resourceCategoryService.getAll();
    }

    @GetMapping("/{id}")
    public ResourceCategoryDetailResponse getResourceCategoryById(@PathVariable Long id) {
        return resourceCategoryService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceCategoryDetailResponse createResourceCategory(
            @Valid @RequestBody CreateResourceCategoryRequest request) {
        return resourceCategoryService.create(request);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceCategoryDetailResponse updateResourceCategory(
            @PathVariable Long id, @Valid @RequestBody UpdateResourceCategoryRequest request) {
        return resourceCategoryService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteResourceCategory(@PathVariable Long id) {
        resourceCategoryService.delete(id);
    }
}
