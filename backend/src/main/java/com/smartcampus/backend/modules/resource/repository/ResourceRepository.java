package com.smartcampus.backend.modules.resource.repository;

import com.smartcampus.backend.common.enums.ResourceStatus;
import com.smartcampus.backend.modules.resource.entity.Resource;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ResourceRepository extends JpaRepository<Resource, Long> {

    Optional<Resource> findByResourceCodeIgnoreCase(String resourceCode);

@Query("""
select distinct r
from Resource r
join fetch r.resourceCategory rc
join fetch r.location l
where (:categoryId is null or rc.id = :categoryId)
  and (:locationId is null or l.id = :locationId)
  and (:status is null or r.status = :status)
  and (:minCapacity is null or r.capacity >= :minCapacity)
  and (
    :search is null or :search = ''
    or lower(r.name) like lower(concat('%', :search, '%'))
    or lower(r.resourceCode) like lower(concat('%', :search, '%'))
    or lower(rc.name) like lower(concat('%', :search, '%'))
    or lower(l.name) like lower(concat('%', :search, '%'))
  )
order by r.name asc
""")
    List<Resource> searchResources(
            @Param("categoryId") Long categoryId,
            @Param("locationId") Long locationId,
            @Param("status") ResourceStatus status,
            @Param("minCapacity") Integer minCapacity,
            @Param("search") String search);

    @Query("""
        select r
        from Resource r
        join fetch r.resourceCategory rc
        join fetch r.location l
        where r.id = :id
    """)
    Optional<Resource> findDetailedById(@Param("id") Long id);

    boolean existsByResourceCategory_Id(Long categoryId);

    boolean existsByLocation_Id(Long locationId);
}