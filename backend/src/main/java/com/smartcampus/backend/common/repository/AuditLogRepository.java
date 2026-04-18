package com.smartcampus.backend.common.repository;

import com.smartcampus.backend.common.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {}
