package com.smartcampus.backend.modules.resource.controller;

import com.smartcampus.backend.modules.resource.dto.ReplaceResourceAvailabilityRequest;
import com.smartcampus.backend.modules.resource.dto.ResourceAvailabilityWindowResponse;
import com.smartcampus.backend.modules.resource.service.ResourceAvailabilityService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/resources/{resourceId}/availability")
@RequiredArgsConstructor
public class ResourceAvailabilityController {

    private final ResourceAvailabilityService resourceAvailabilityService;

    @GetMapping
    public List<ResourceAvailabilityWindowResponse> getAvailability(@PathVariable Long resourceId) {
        return resourceAvailabilityService.getAvailability(resourceId);
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<ResourceAvailabilityWindowResponse> replaceAvailability(
            @PathVariable Long resourceId,
            @Valid @RequestBody ReplaceResourceAvailabilityRequest request) {
        return resourceAvailabilityService.replaceAvailability(resourceId, request);
    }
}
