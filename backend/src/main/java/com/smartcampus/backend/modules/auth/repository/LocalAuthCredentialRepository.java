package com.smartcampus.backend.modules.auth.repository;

import com.smartcampus.backend.common.entity.LocalAuthCredential;
import java.util.Collection;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocalAuthCredentialRepository extends JpaRepository<LocalAuthCredential, Long> {

    Optional<LocalAuthCredential> findByUserId(Long userId);

    List<LocalAuthCredential> findByUserIdIn(Collection<Long> userIds);

    boolean existsByUserId(Long userId);

    void deleteByUserId(Long userId);
}
