package com.smartcampus.backend.modules.resource.mapper;

import com.smartcampus.backend.modules.resource.dto.LocationDetailResponse;
import com.smartcampus.backend.modules.resource.dto.LocationSummaryResponse;
import com.smartcampus.backend.modules.resource.dto.ResourceAvailabilityWindowResponse;
import com.smartcampus.backend.modules.resource.dto.ResourceCategoryDetailResponse;
import com.smartcampus.backend.modules.resource.dto.ResourceCategorySummaryResponse;
import com.smartcampus.backend.modules.resource.dto.ResourceDetailResponse;
import com.smartcampus.backend.modules.resource.dto.ResourceSummaryResponse;
import com.smartcampus.backend.modules.resource.entity.Location;
import com.smartcampus.backend.modules.resource.entity.Resource;
import com.smartcampus.backend.modules.resource.entity.ResourceAvailabilityWindow;
import com.smartcampus.backend.modules.resource.entity.ResourceCategory;
import org.springframework.stereotype.Component;

@Component
public class ResourceMapper {

    public ResourceCategorySummaryResponse toCategorySummary(ResourceCategory category) {
        return new ResourceCategorySummaryResponse(
                category.getId(), category.getCode(), category.getName(), category.getIsActive());
    }

    public ResourceCategoryDetailResponse toCategoryDetail(ResourceCategory category) {
        return new ResourceCategoryDetailResponse(
                category.getId(),
                category.getCode(),
                category.getName(),
                category.getDescription(),
                category.getIsActive());
    }

    public LocationSummaryResponse toLocationSummary(Location location) {
        return new LocationSummaryResponse(
                location.getId(),
                location.getCode(),
                location.getName(),
                location.getBuilding(),
                location.getFloor(),
                location.getRoomIdentifier());
    }

    public LocationDetailResponse toLocationDetail(Location location) {
        return new LocationDetailResponse(
                location.getId(),
                location.getCode(),
                location.getName(),
                location.getBuilding(),
                location.getFloor(),
                location.getRoomIdentifier(),
                location.getDescription());
    }

    public ResourceSummaryResponse toResourceSummary(Resource resource) {
        return new ResourceSummaryResponse(
                resource.getId(),
                resource.getResourceCode(),
                resource.getName(),
                resource.getResourceCategory().getId(),
                resource.getResourceCategory().getCode(),
                resource.getResourceCategory().getName(),
                resource.getLocation().getId(),
                resource.getLocation().getCode(),
                resource.getLocation().getName(),
                resource.getCapacity(),
                resource.getStatus(),
                resource.getRequiresApproval(),
                resource.getImageUrl());
    }

    public ResourceDetailResponse toResourceDetail(Resource resource) {
        return new ResourceDetailResponse(
                resource.getId(),
                resource.getResourceCode(),
                resource.getName(),
                resource.getDescription(),
                resource.getCapacity(),
                resource.getStatus(),
                resource.getRequiresApproval(),
                resource.getImageUrl(),
                resource.getNotes(),
                toCategorySummary(resource.getResourceCategory()),
                toLocationSummary(resource.getLocation()));
    }

    public ResourceAvailabilityWindowResponse toAvailabilityResponse(ResourceAvailabilityWindow window) {
        return new ResourceAvailabilityWindowResponse(
                window.getId(),
                window.getDayOfWeek(),
                window.getStartTime(),
                window.getEndTime(),
                window.getIsAvailable(),
                window.getEffectiveFrom(),
                window.getEffectiveTo());
    }
}
