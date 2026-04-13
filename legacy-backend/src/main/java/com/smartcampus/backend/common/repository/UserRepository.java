package com.smartcampus.backend.common.repository;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    long countByRole_RoleNameAndStatus(String roleName, UserStatus status);

    List<User> findByRole_RoleName(String roleName);
}
