package com.smartcampus.backend.modules.auth.service;

import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.modules.auth.exception.AuthFailureCode;
import com.smartcampus.backend.modules.user.repository.UserRoleRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthProvisioningVerifier {

    private final UserRoleRepository userRoleRepository;

    public Optional<AuthFailureCode> verifyActiveProvisionedMembership(String email) {
        Optional<UserRole> membership = userRoleRepository.findActiveByUserEmail(email);
        if (membership.isEmpty()) {
            log.warn("Auth provisioning verification failed: no active local role found for email={}", email);
            return Optional.of(AuthFailureCode.PROVISIONING_FAILED);
        }

        if (membership.get().getUser().getStatus() != UserStatus.ACTIVE) {
            log.warn(
                    "Auth provisioning verification failed: local user is not active for email={} status={}",
                    email,
                    membership.get().getUser().getStatus());
            return Optional.of(AuthFailureCode.ACCOUNT_BLOCKED);
        }

        return Optional.empty();
    }
}
