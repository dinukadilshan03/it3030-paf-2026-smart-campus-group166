package com.smartcampus.backend.modules.resource.repository;

import com.smartcampus.backend.modules.resource.entity.Location;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationRepository extends JpaRepository<Location, Long> {

    Optional<Location> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);
}
