package com.smartcampus.backend.modules.resource.repository;

import com.smartcampus.backend.common.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    List<Resource> findByTypeContainingIgnoreCase(String type);

    List<Resource> findByLocationContainingIgnoreCase(String location);

    List<Resource> findByStatusIgnoreCase(String status);

    List<Resource> findByCapacityGreaterThanEqual(Integer capacity);

    List<Resource> findByTypeContainingIgnoreCaseAndLocationContainingIgnoreCaseAndStatusIgnoreCase(
            String type, String location, String status
    );
}