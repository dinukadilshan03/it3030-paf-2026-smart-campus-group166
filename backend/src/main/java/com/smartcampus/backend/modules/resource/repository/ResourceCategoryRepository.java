package com.smartcampus.backend.modules.resource.repository;

import com.smartcampus.backend.modules.resource.entity.ResourceCategory;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResourceCategoryRepository extends JpaRepository<ResourceCategory, Long> {

    Optional<ResourceCategory> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    long countById(Long id);
}
