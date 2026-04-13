package com.smartcampus.backend.modules.resource.service;

import com.smartcampus.backend.modules.resource.dto.ReplaceResourceAvailabilityRequest;
import com.smartcampus.backend.modules.resource.dto.ResourceAvailabilityWindowRequest;
import com.smartcampus.backend.modules.resource.dto.ResourceAvailabilityWindowResponse;
import com.smartcampus.backend.modules.resource.entity.Resource;
import com.smartcampus.backend.modules.resource.entity.ResourceAvailabilityWindow;
import com.smartcampus.backend.modules.resource.mapper.ResourceMapper;
import com.smartcampus.backend.modules.resource.repository.ResourceAvailabilityWindowRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ResourceAvailabilityService {

    private final ResourceAvailabilityWindowRepository resourceAvailabilityWindowRepository;
    private final ResourceService resourceService;
    private final ResourceMapper resourceMapper;

    @Transactional(readOnly = true)
    public List<ResourceAvailabilityWindowResponse> getAvailability(Long resourceId) {
        resourceService.getManagedResource(resourceId);
        return resourceAvailabilityWindowRepository.findByResource_IdOrderByDayOfWeekAscStartTimeAsc(
                        resourceId)
                .stream()
                .map(resourceMapper::toAvailabilityResponse)
                .toList();
    }

    @Transactional
    public List<ResourceAvailabilityWindowResponse> replaceAvailability(
            Long resourceId, ReplaceResourceAvailabilityRequest request) {
        Resource resource = resourceService.getManagedResource(resourceId);

        List<ResourceAvailabilityWindow> replacementWindows =
                request.windows().stream()
                        .map(window -> buildAvailabilityWindow(resource, window))
                        .toList();

        resourceAvailabilityWindowRepository.deleteByResource_Id(resourceId);
        resourceAvailabilityWindowRepository.saveAll(replacementWindows);

        return resourceAvailabilityWindowRepository.findByResource_IdOrderByDayOfWeekAscStartTimeAsc(
                        resourceId)
                .stream()
                .map(resourceMapper::toAvailabilityResponse)
                .toList();
    }

    private ResourceAvailabilityWindow buildAvailabilityWindow(
            Resource resource, ResourceAvailabilityWindowRequest window) {
        validateWindow(window);
        return ResourceAvailabilityWindow.builder()
                .resource(resource)
                .dayOfWeek(window.dayOfWeek())
                .startTime(window.startTime())
                .endTime(window.endTime())
                .isAvailable(window.isAvailable() == null ? true : window.isAvailable())
                .effectiveFrom(window.effectiveFrom())
                .effectiveTo(window.effectiveTo())
                .build();
    }

    private void validateWindow(ResourceAvailabilityWindowRequest window) {
        if (!window.startTime().isBefore(window.endTime())) {
            throw new IllegalArgumentException("Availability window start time must be before end time");
        }
        if (window.effectiveFrom() != null
                && window.effectiveTo() != null
                && window.effectiveTo().isBefore(window.effectiveFrom())) {
            throw new IllegalArgumentException(
                    "Availability window effectiveTo must be on or after effectiveFrom");
        }
    }
}
