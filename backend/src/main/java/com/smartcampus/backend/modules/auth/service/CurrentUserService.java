package com.smartcampus.backend.modules.auth.service;

import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.modules.user.repository.UserRoleRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRoleRepository userRoleRepository;
    private final AuthenticatedEmailResolver authenticatedEmailResolver;

    public Optional<UserRole> getCurrentUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!authenticatedEmailResolver.isAuthenticated(authentication)) {
            return Optional.empty();
        }

        return userRoleRepository
                .findActiveByUserEmail(authenticatedEmailResolver.resolveAuthenticatedEmail(authentication))
                .filter(userRole -> userRole.getUser().getStatus() == UserStatus.ACTIVE);
    }
}
