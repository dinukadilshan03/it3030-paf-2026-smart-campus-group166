package com.smartcampus.backend.modules.user.repository;

import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRoleRepository extends JpaRepository<UserRole, Long> {

    @Query(
            """
            select ur
            from UserRole ur
            join fetch ur.user u
            join fetch ur.role r
            where ur.isActive = true
              and lower(u.email) = lower(:email)
            """)
    Optional<UserRole> findActiveByUserEmail(@Param("email") String email);

    @Query(
            """
            select ur
            from UserRole ur
            join fetch ur.user u
            join fetch ur.role r
            where ur.isActive = true
              and u.id = :userId
            """)
    Optional<UserRole> findActiveByUserId(@Param("userId") Long userId);

    @Query(
            """
            select ur
            from UserRole ur
            join fetch ur.user u
            join fetch ur.role r
            where ur.isActive = true
              and u.id in :userIds
            """)
    List<UserRole> findActiveByUserIds(@Param("userIds") Collection<Long> userIds);

    @Query(
            """
            select count(ur)
            from UserRole ur
            where ur.isActive = true
              and ur.role.code = :roleCode
              and ur.user.status = :status
            """)
    long countActiveUsersByRoleAndStatus(
            @Param("roleCode") RoleCode roleCode, @Param("status") UserStatus status);
}
