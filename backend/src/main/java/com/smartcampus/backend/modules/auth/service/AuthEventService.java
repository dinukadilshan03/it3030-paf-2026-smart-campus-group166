package com.smartcampus.backend.modules.auth.service;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.enums.AuthEventType;
import com.smartcampus.backend.common.enums.UserLoginMethod;
import com.smartcampus.backend.modules.auth.entity.AuthEvent;
import com.smartcampus.backend.modules.auth.repository.AuthEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthEventService {

    private final AuthEventRepository authEventRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(
            User user,
            String normalizedEmail,
            AuthEventType eventType,
            UserLoginMethod loginMethod,
            String failureCode) {
        authEventRepository.save(
                AuthEvent.builder()
                        .user(user)
                        .normalizedEmail(normalizedEmail)
                        .eventType(eventType)
                        .loginMethod(loginMethod)
                        .failureCode(failureCode)
                        .build());
    }
}
