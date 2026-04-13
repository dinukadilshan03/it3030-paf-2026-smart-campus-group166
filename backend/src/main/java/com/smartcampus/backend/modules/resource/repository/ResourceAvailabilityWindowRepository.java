package com.smartcampus.backend.modules.resource.repository;

import com.smartcampus.backend.modules.resource.entity.ResourceAvailabilityWindow;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResourceAvailabilityWindowRepository
        extends JpaRepository<ResourceAvailabilityWindow, Long> {

    List<ResourceAvailabilityWindow> findByResource_IdOrderByDayOfWeekAscStartTimeAsc(Long resourceId);

    void deleteByResource_Id(Long resourceId);
}
