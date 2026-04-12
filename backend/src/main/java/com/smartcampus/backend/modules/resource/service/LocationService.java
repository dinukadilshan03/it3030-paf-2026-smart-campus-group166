package com.smartcampus.backend.modules.resource.service;

import com.smartcampus.backend.common.exception.DuplicateResourceException;
import com.smartcampus.backend.common.exception.ResourceConflictException;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.modules.resource.dto.CreateLocationRequest;
import com.smartcampus.backend.modules.resource.dto.LocationDetailResponse;
import com.smartcampus.backend.modules.resource.dto.LocationSummaryResponse;
import com.smartcampus.backend.modules.resource.dto.UpdateLocationRequest;
import com.smartcampus.backend.modules.resource.entity.Location;
import com.smartcampus.backend.modules.resource.mapper.ResourceMapper;
import com.smartcampus.backend.modules.resource.repository.LocationRepository;
import com.smartcampus.backend.modules.resource.repository.ResourceRepository;
import jakarta.persistence.EntityManager;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;
    private final ResourceRepository resourceRepository;
    private final ResourceMapper resourceMapper;
    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public List<LocationSummaryResponse> getAll() {
        return locationRepository.findAll().stream()
                .sorted(java.util.Comparator.comparing(Location::getName, String.CASE_INSENSITIVE_ORDER))
                .map(resourceMapper::toLocationSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public LocationDetailResponse getById(Long id) {
        return resourceMapper.toLocationDetail(getManagedLocation(id));
    }

    @Transactional
    public LocationDetailResponse create(CreateLocationRequest request) {
        validateUniqueCode(request.code(), null);
        Location location =
                Location.builder()
                        .code(normalizeCode(request.code()))
                        .name(request.name().trim())
                        .building(normalizeOptionalText(request.building()))
                        .floor(normalizeOptionalText(request.floor()))
                        .roomIdentifier(normalizeOptionalText(request.roomIdentifier()))
                        .description(normalizeOptionalText(request.description()))
                        .build();

        return resourceMapper.toLocationDetail(locationRepository.save(location));
    }

    @Transactional
    public LocationDetailResponse update(Long id, UpdateLocationRequest request) {
        Location location = getManagedLocation(id);
        if (request.code() != null) {
            validateRequiredText(request.code(), "Location code");
            validateUniqueCode(request.code(), id);
            location.setCode(normalizeCode(request.code()));
        }
        if (request.name() != null) {
            validateRequiredText(request.name(), "Location name");
            location.setName(request.name().trim());
        }
        if (request.building() != null) {
            location.setBuilding(normalizeOptionalText(request.building()));
        }
        if (request.floor() != null) {
            location.setFloor(normalizeOptionalText(request.floor()));
        }
        if (request.roomIdentifier() != null) {
            location.setRoomIdentifier(normalizeOptionalText(request.roomIdentifier()));
        }
        if (request.description() != null) {
            location.setDescription(normalizeOptionalText(request.description()));
        }

        return resourceMapper.toLocationDetail(locationRepository.save(location));
    }

    @Transactional
    public void delete(Long id) {
        Location location = getManagedLocation(id);
        if (resourceRepository.existsByLocation_Id(id)) {
            throw new ResourceConflictException(
                    "Cannot delete location while resources still reference it");
        }

        Long ticketCount =
                entityManager
                        .createQuery("select count(t) from Ticket t where t.location.id = :locationId", Long.class)
                        .setParameter("locationId", id)
                        .getSingleResult();
        if (ticketCount > 0) {
            throw new ResourceConflictException(
                    "Cannot delete location while tickets still reference it");
        }

        locationRepository.delete(location);
    }

    public Location getManagedLocation(Long id) {
        return locationRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found for id: " + id));
    }

    private void validateUniqueCode(String code, Long currentId) {
        locationRepository
                .findByCodeIgnoreCase(code.trim())
                .filter(existing -> !existing.getId().equals(currentId))
                .ifPresent(
                        existing -> {
                            throw new DuplicateResourceException("Location code already exists");
                        });
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase();
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
}
