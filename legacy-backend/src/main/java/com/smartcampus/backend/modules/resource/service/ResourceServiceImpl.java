package com.smartcampus.backend.modules.resource.service;

import com.smartcampus.backend.common.entity.Resource;
import com.smartcampus.backend.modules.resource.dto.ResourceRequestDTO;
import com.smartcampus.backend.modules.resource.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceServiceImpl(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    @Override
    public Resource createResource(ResourceRequestDTO dto) {
        Resource resource = new Resource();
        resource.setName(dto.getName());
        resource.setType(dto.getType());
        resource.setCapacity(dto.getCapacity());
        resource.setLocation(dto.getLocation());
        resource.setStatus(dto.getStatus());
        resource.setDescription(dto.getDescription());

        return resourceRepository.save(resource);
    }

    @Override
    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    @Override
    public Resource getResourceById(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));
    }

    @Override
    public Resource updateResource(Long id, ResourceRequestDTO dto) {
        Resource resource = getResourceById(id);

        resource.setName(dto.getName());
        resource.setType(dto.getType());
        resource.setCapacity(dto.getCapacity());
        resource.setLocation(dto.getLocation());
        resource.setStatus(dto.getStatus());
        resource.setDescription(dto.getDescription());

        return resourceRepository.save(resource);
    }

    @Override
    public void deleteResource(Long id) {
        if (!resourceRepository.existsById(id)) {
            throw new RuntimeException("Resource not found with id: " + id);
        }
        resourceRepository.deleteById(id);
    }

    @Override
    public List<Resource> searchResources(String type, String location, String status, Integer minCapacity) {
        if (type != null && !type.isBlank() &&
            location != null && !location.isBlank() &&
            status != null && !status.isBlank()) {
            return resourceRepository.findByTypeContainingIgnoreCaseAndLocationContainingIgnoreCaseAndStatusIgnoreCase(
                    type, location, status
            );
        }

        if (type != null && !type.isBlank()) {
            return resourceRepository.findByTypeContainingIgnoreCase(type);
        }

        if (location != null && !location.isBlank()) {
            return resourceRepository.findByLocationContainingIgnoreCase(location);
        }

        if (status != null && !status.isBlank()) {
            return resourceRepository.findByStatusIgnoreCase(status);
        }

        if (minCapacity != null) {
            return resourceRepository.findByCapacityGreaterThanEqual(minCapacity);
        }

        return resourceRepository.findAll();
    }
}