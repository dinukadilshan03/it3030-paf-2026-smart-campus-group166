package com.smartcampus.backend.modules.resource.controller;

import com.smartcampus.backend.common.enums.ResourceStatus;
import com.smartcampus.backend.modules.resource.dto.CreateResourceRequest;
import com.smartcampus.backend.modules.resource.dto.ResourceDetailResponse;
import com.smartcampus.backend.modules.resource.dto.ResourceSummaryResponse;
import com.smartcampus.backend.modules.resource.dto.UpdateResourceRequest;
import com.smartcampus.backend.modules.resource.service.ResourceService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @GetMapping
    public List<ResourceSummaryResponse> getResources(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String search) {
        return resourceService.getResources(categoryId, locationId, status, minCapacity, search);
    }

    @GetMapping("/{id}")
    public ResourceDetailResponse getResourceById(@PathVariable Long id) {
        return resourceService.getResourceById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceDetailResponse createResource(@Valid @RequestBody CreateResourceRequest request) {
        return resourceService.create(request);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceDetailResponse updateResource(
            @PathVariable Long id, @Valid @RequestBody UpdateResourceRequest request) {
        return resourceService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteResource(@PathVariable Long id) {
        resourceService.delete(id);
    }
}
