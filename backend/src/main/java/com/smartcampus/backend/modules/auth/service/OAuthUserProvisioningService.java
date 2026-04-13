package com.smartcampus.backend.modules.auth.service;

import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.modules.auth.exception.AuthFailureCode;
import com.smartcampus.backend.modules.auth.exception.AuthFlowException;
import com.smartcampus.backend.modules.user.repository.RoleRepository;
import com.smartcampus.backend.modules.user.repository.UserRepository;
import com.smartcampus.backend.modules.user.repository.UserRoleRepository;
import java.time.LocalDateTime;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OAuthUserProvisioningService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;

    @Transactional
    public UserRole provisionFromGoogleAttributes(Map<String, Object> attributes) {
        String email = requireString(attributes, "email");
        String googleSub = requireString(attributes, "sub");

        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(User::new);
        boolean existingUser = user.getId() != null;
        validateGoogleSubOwnership(user.getId(), googleSub);
        validateUserStatus(user);

        user.setEmail(email);
        user.setGoogleSub(googleSub);
        user.setFirstName(stringOrNull(attributes, "given_name"));
        user.setLastName(stringOrNull(attributes, "family_name"));
        user.setDisplayName(resolveDisplayName(attributes, email));
        user.setProfileImageUrl(stringOrNull(attributes, "picture"));
        user.setStatus(user.getStatus() == null ? UserStatus.ACTIVE : user.getStatus());
        user.setLastLoginAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);
        log.info(
                "Local auth user {} for email={} id={}",
                existingUser ? "updated" : "created",
                savedUser.getEmail(),
                savedUser.getId());
        UserRole activeRole = userRoleRepository
                .findActiveByUserId(savedUser.getId())
                .map(
                        userRole -> {
                            log.info(
                                    "Reused existing active role={} for email={}",
                                    userRole.getRole().getCode(),
                                    savedUser.getEmail());
                            return userRole;
                        })
                .orElseGet(() -> createDefaultRoleAssignment(savedUser));
        validateGoogleRole(activeRole);
        return activeRole;
    }

    private void validateUserStatus(User user) {
        if (user.getId() != null && user.getStatus() != null && user.getStatus() != UserStatus.ACTIVE) {
            throw new AuthFlowException(
                    AuthFailureCode.ACCOUNT_BLOCKED,
                    "This account is not allowed to sign in");
        }
    }

    private UserRole createDefaultRoleAssignment(User user) {
        RoleCode roleCode = RoleCode.STUDENT;
        Role role =
                roleRepository
                        .findByCode(roleCode)
                        .orElseThrow(() -> new ResourceNotFoundException("Role not found for code: " + roleCode));

        UserRole userRole =
                userRoleRepository.save(
                UserRole.builder().user(user).role(role).isActive(true).build());
        log.info("Created default role={} for email={}", roleCode, user.getEmail());
        return userRole;
    }

    private void validateGoogleRole(UserRole activeRole) {
        if (activeRole.getRole().getCode() != RoleCode.STUDENT) {
            throw new AuthFlowException(
                    AuthFailureCode.OAUTH_NOT_ALLOWED,
                    "Google sign-in is only available for student accounts");
        }
    }

    private void validateGoogleSubOwnership(Long currentUserId, String googleSub) {
        userRepository
                .findByGoogleSub(googleSub)
                .filter(existing -> !existing.getId().equals(currentUserId))
                .ifPresent(
                        existing -> {
                            throw new AuthFlowException(
                                    AuthFailureCode.INVALID_PROFILE,
                                    "Google account is already linked to another user");
                        });
    }

    private String resolveDisplayName(Map<String, Object> attributes, String email) {
        String name = stringOrNull(attributes, "name");
        return name == null || name.isBlank() ? email : name;
    }

    private String requireString(Map<String, Object> attributes, String key) {
        String value = stringOrNull(attributes, key);
        if (value == null || value.isBlank()) {
            throw new AuthFlowException(
                    AuthFailureCode.INVALID_PROFILE,
                    "Missing required Google attribute: " + key);
        }
        return value;
    }

    private String stringOrNull(Map<String, Object> attributes, String key) {
        Object value = attributes.get(key);
        return value == null ? null : value.toString();
    }
}
