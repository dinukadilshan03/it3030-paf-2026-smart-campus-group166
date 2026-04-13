package com.smartcampus.backend.modules.resource.controller;

import com.smartcampus.backend.modules.resource.dto.CreateLocationRequest;
import com.smartcampus.backend.modules.resource.dto.LocationDetailResponse;
import com.smartcampus.backend.modules.resource.dto.LocationSummaryResponse;
import com.smartcampus.backend.modules.resource.dto.UpdateLocationRequest;
import com.smartcampus.backend.modules.resource.service.LocationService;
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
@RequestMapping("/api/v1/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping
    public List<LocationSummaryResponse> getLocations() {
        return locationService.getAll();
    }

    @GetMapping("/{id}")
    public LocationDetailResponse getLocationById(@PathVariable Long id) {
        return locationService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public LocationDetailResponse createLocation(@Valid @RequestBody CreateLocationRequest request) {
        return locationService.create(request);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public LocationDetailResponse updateLocation(
            @PathVariable Long id, @Valid @RequestBody UpdateLocationRequest request) {
        return locationService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLocation(@PathVariable Long id) {
        locationService.delete(id);
    }
}
