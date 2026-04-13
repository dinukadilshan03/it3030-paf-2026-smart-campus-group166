package com.smartcampus.backend.modules.user.repository;

import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.enums.RoleCode;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByCode(RoleCode code);
}
