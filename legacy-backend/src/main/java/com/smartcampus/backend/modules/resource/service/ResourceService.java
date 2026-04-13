package com.smartcampus.backend.modules.resource.service;

import com.smartcampus.backend.common.entity.Resource;
import com.smartcampus.backend.modules.resource.dto.ResourceRequestDTO;

import java.util.List;

public interface ResourceService {

    Resource createResource(ResourceRequestDTO dto);

    List<Resource> getAllResources();

    Resource getResourceById(Long id);

    Resource updateResource(Long id, ResourceRequestDTO dto);

    void deleteResource(Long id);

    List<Resource> searchResources(String type, String location, String status, Integer minCapacity);
}