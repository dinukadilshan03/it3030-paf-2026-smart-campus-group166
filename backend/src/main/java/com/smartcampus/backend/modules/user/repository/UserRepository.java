package com.smartcampus.backend.modules.user.repository;

import com.smartcampus.backend.common.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByGoogleSub(String googleSub);

    @Query(
            value =
                    """
            select distinct u.*
            from users u
            left join user_roles ur on ur.user_id = u.id and ur.is_active = true
            left join roles r on r.id = ur.role_id
            where (:roleCode is null or r.code = :roleCode)
              and (:status is null or u.status = :status)
              and (
                :search is null
                or lower(u.email) like concat('%', lower(:search), '%')
                or lower(coalesce(u.display_name, '')) like concat('%', lower(:search), '%')
                or lower(coalesce(u.first_name, '')) like concat('%', lower(:search), '%')
                or lower(coalesce(u.last_name, '')) like concat('%', lower(:search), '%')
              )
            order by coalesce(u.display_name, u.email), u.email
            """,
            nativeQuery = true)
    List<User> searchUsers(
            @Param("roleCode") String roleCode,
            @Param("status") String status,
            @Param("search") String search);
}
