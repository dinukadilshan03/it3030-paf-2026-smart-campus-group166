package com.smartcampus.backend.modules.auth.service;

import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.common.exception.DuplicateResourceException;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.modules.user.repository.RoleRepository;
import com.smartcampus.backend.modules.user.repository.UserRepository;
import com.smartcampus.backend.modules.user.repository.UserRoleRepository;
import java.time.LocalDateTime;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OAuthUserProvisioningService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;

    @Value("${app.bootstrap-admin.email:}")
    private String bootstrapAdminEmail;

    @Transactional
    public UserRole provisionFromGoogleAttributes(Map<String, Object> attributes) {
        String email = requireString(attributes, "email");
        String googleSub = requireString(attributes, "sub");

        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(User::new);
        validateGoogleSubOwnership(user.getId(), googleSub);

        user.setEmail(email);
        user.setGoogleSub(googleSub);
        user.setFirstName(stringOrNull(attributes, "given_name"));
        user.setLastName(stringOrNull(attributes, "family_name"));
        user.setDisplayName(resolveDisplayName(attributes, email));
        user.setProfileImageUrl(stringOrNull(attributes, "picture"));
        user.setStatus(user.getStatus() == null ? UserStatus.ACTIVE : user.getStatus());
        user.setLastLoginAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);
        return userRoleRepository
                .findActiveByUserId(savedUser.getId())
                .orElseGet(() -> createDefaultRoleAssignment(savedUser));
    }

    private UserRole createDefaultRoleAssignment(User user) {
        RoleCode roleCode = resolveDefaultRole(user.getEmail());
        Role role =
                roleRepository
                        .findByCode(roleCode)
                        .orElseThrow(() -> new ResourceNotFoundException("Role not found for code: " + roleCode));

        return userRoleRepository.save(
                UserRole.builder().user(user).role(role).isActive(true).build());
    }

    private RoleCode resolveDefaultRole(String email) {
        if (bootstrapAdminEmail != null
                && !bootstrapAdminEmail.isBlank()
                && bootstrapAdminEmail.equalsIgnoreCase(email)) {
            return RoleCode.ADMIN;
        }
        return RoleCode.STUDENT;
    }

    private void validateGoogleSubOwnership(Long currentUserId, String googleSub) {
        userRepository
                .findByGoogleSub(googleSub)
                .filter(existing -> !existing.getId().equals(currentUserId))
                .ifPresent(
                        existing -> {
                            throw new DuplicateResourceException(
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
            throw new IllegalArgumentException("Missing required Google attribute: " + key);
        }
        return value;
    }

    private String stringOrNull(Map<String, Object> attributes, String key) {
        Object value = attributes.get(key);
        return value == null ? null : value.toString();
    }
}
