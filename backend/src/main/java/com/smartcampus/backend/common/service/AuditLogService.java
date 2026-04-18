package com.smartcampus.backend.common.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.backend.common.entity.AuditLog;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.repository.AuditLogRepository;
import com.smartcampus.backend.modules.auth.service.CurrentUserService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;

    @Transactional
    public void log(String entityType, Long entityId, String action, Map<String, ?> oldValue, Map<String, ?> newValue) {
        auditLogRepository.save(
                AuditLog.builder()
                        .actorUser(resolveActorUser())
                        .entityType(entityType)
                        .entityId(entityId)
                        .action(action)
                        .oldValueJson(writeJson(oldValue))
                        .newValueJson(writeJson(newValue))
                        .build());
    }

    private User resolveActorUser() {
        return currentUserService.getCurrentUserRole().map(membership -> membership.getUser()).orElse(null);
    }

    private String writeJson(Map<String, ?> value) {
        if (value == null || value.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize audit log payload", ex);
        }
    }
}
