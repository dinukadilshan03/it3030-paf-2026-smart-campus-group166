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
            select u.*
            from users u
            where (:status is null or u.status = :status)
              and (
                :roleCode is null
                or exists (
                  select 1
                  from user_roles ur
                  join roles r on r.id = ur.role_id
                  where ur.user_id = u.id
                    and ur.is_active = true
                    and r.code = :roleCode
                )
              )
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
