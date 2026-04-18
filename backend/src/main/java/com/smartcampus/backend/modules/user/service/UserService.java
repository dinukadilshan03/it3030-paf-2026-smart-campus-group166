package com.smartcampus.backend.modules.user.service;

import com.smartcampus.backend.common.entity.LocalAuthCredential;
import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.AuthEventType;
import com.smartcampus.backend.common.enums.UserLoginMethod;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.common.exception.ResourceConflictException;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.common.service.AuditLogService;
import com.smartcampus.backend.modules.auth.repository.LocalAuthCredentialRepository;
import com.smartcampus.backend.modules.auth.service.AuthEventService;
import com.smartcampus.backend.modules.user.dto.CreateUserRequest;
import com.smartcampus.backend.modules.user.dto.UpdateUserRequest;
import com.smartcampus.backend.modules.user.dto.UserDetailResponse;
import com.smartcampus.backend.modules.user.dto.UserSummaryResponse;
import com.smartcampus.backend.modules.user.mapper.UserMapper;
import com.smartcampus.backend.modules.user.repository.RoleRepository;
import com.smartcampus.backend.modules.user.repository.UserRepository;
import com.smartcampus.backend.modules.user.repository.UserRoleRepository;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final LocalAuthCredentialRepository localAuthCredentialRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final AuditLogService auditLogService;
    private final AuthEventService authEventService;

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getUsers(RoleCode role, UserStatus status, String search) {
        List<User> users =
                userRepository.searchUsers(
                        role == null ? null : role.name(),
                        status == null ? null : status.name(),
                        normalizeSearch(search));
        if (users.isEmpty()) {
            return List.of();
        }

        Map<Long, UserRole> activeRoles =
                userRoleRepository.findActiveByUserIds(users.stream().map(User::getId).toList()).stream()
                        .collect(java.util.stream.Collectors.toMap(ur -> ur.getUser().getId(), Function.identity()));
        Map<Long, LocalAuthCredential> credentialsByUserId =
                localAuthCredentialRepository.findByUserIdIn(users.stream().map(User::getId).toList()).stream()
                        .collect(java.util.stream.Collectors.toMap(credential -> credential.getUser().getId(), Function.identity()));

        return users.stream()
                .map(
                        user -> {
                            RoleCode effectiveRole =
                                    activeRoles.get(user.getId()) == null
                                            ? null
                                            : activeRoles.get(user.getId()).getRole().getCode();
                            LocalAuthCredential credential = credentialsByUserId.get(user.getId());
                            return userMapper.toSummary(
                                    user,
                                    effectiveRole,
                                    credential != null,
                                    credential != null && credential.isMustChangePassword(),
                                    resolveLoginMethod(effectiveRole));
                        })
                .toList();
    }

    @Transactional(readOnly = true)
    public UserDetailResponse getUserById(Long id) {
        User user = getManagedUser(id);
        UserRole activeRole = getActiveRole(user.getId());
        return toUserDetail(user, activeRole.getRole().getCode());
    }

    @Transactional
    public UserDetailResponse createUser(CreateUserRequest request) {
        String email = normalizeRequiredEmail(request.email());
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new ResourceConflictException("A user already exists for email: " + email);
        }

        validateManagedRole(request.role());
        Role role =
                roleRepository
                        .findByCode(request.role())
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Role not found for code: " + request.role()));

        User user =
                User.builder()
                        .email(email)
                        .firstName(trimToNull(request.firstName()))
                        .lastName(trimToNull(request.lastName()))
                        .displayName(trimToNull(request.displayName()))
                        .phone(trimToNull(request.phone()))
                        .profileImageUrl(trimToNull(request.profileImageUrl()))
                        .status(request.status() == null ? UserStatus.ACTIVE : request.status())
                        .build();
        User savedUser = userRepository.save(user);
        userRoleRepository.save(UserRole.builder().user(savedUser).role(role).isActive(true).build());
        Map<String, Object> createdState = new LinkedHashMap<>();
        createdState.put("email", savedUser.getEmail());
        createdState.put("displayName", savedUser.getDisplayName());
        createdState.put("role", role.getCode().name());
        createdState.put("status", savedUser.getStatus().name());
        auditLogService.log(
                "USER",
                savedUser.getId(),
                "CREATED",
                null,
                createdState);

        return toUserDetail(savedUser, role.getCode());
    }

    @Transactional
    public UserDetailResponse updateUser(Long id, UpdateUserRequest request) {
        User user = getManagedUser(id);
        Map<String, Object> previousState = buildUserSnapshot(user);
        userMapper.applyUpdates(
                user,
                request.firstName(),
                request.lastName(),
                request.displayName(),
                request.phone(),
                request.profileImageUrl());

        User savedUser = userRepository.save(user);
        auditLogService.log("USER", savedUser.getId(), "PROFILE_UPDATED", previousState, buildUserSnapshot(savedUser));
        UserRole activeRole = getActiveRole(savedUser.getId());
        return toUserDetail(savedUser, activeRole.getRole().getCode());
    }

    @Transactional
    public UserDetailResponse updateUserRole(Long id, RoleCode roleCode) {
        User user = getManagedUser(id);
        validateManagedRole(roleCode);
        UserRole currentRole = getActiveRole(user.getId());
        if (currentRole.getRole().getCode() != roleCode) {
            String previousRole = currentRole.getRole().getCode().name();
            currentRole.setIsActive(false);
            currentRole.setEndedAt(LocalDateTime.now());
            userRoleRepository.save(currentRole);

            Role role =
                    roleRepository
                            .findByCode(roleCode)
                            .orElseThrow(() -> new ResourceNotFoundException("Role not found for code: " + roleCode));
            userRoleRepository.save(UserRole.builder().user(user).role(role).isActive(true).build());
            auditLogService.log(
                    "USER",
                    user.getId(),
                    "ROLE_CHANGED",
                    Map.of("role", previousRole),
                    Map.of("role", roleCode.name()));
        }

        UserRole refreshedRole = getActiveRole(user.getId());
        return toUserDetail(user, refreshedRole.getRole().getCode());
    }

    @Transactional
    public UserDetailResponse updateUserStatus(Long id, UserStatus status) {
        User user = getManagedUser(id);
        UserRole activeRole = getActiveRole(user.getId());
        validateAdminAvailability(user, activeRole.getRole().getCode(), status);
        UserStatus previousStatus = user.getStatus();
        user.setStatus(status);
        User savedUser = userRepository.save(user);
        if (previousStatus != status) {
            auditLogService.log(
                    "USER",
                    savedUser.getId(),
                    "STATUS_CHANGED",
                    Map.of("status", previousStatus.name()),
                    Map.of("status", status.name()));
        }
        return toUserDetail(savedUser, activeRole.getRole().getCode());
    }

    @Transactional
    public UserDetailResponse createLocalCredentials(Long id, String temporaryPassword) {
        User user = getManagedUser(id);
        UserRole activeRole = getActiveRole(user.getId());
        validateLocalCredentialEligibleRole(activeRole.getRole().getCode());
        if (localAuthCredentialRepository.existsByUserId(user.getId())) {
            throw new ResourceConflictException("Local credentials already exist for this user");
        }

        localAuthCredentialRepository.save(
                LocalAuthCredential.builder()
                        .user(user)
                        .passwordHash(passwordEncoder.encode(temporaryPassword))
                        .mustChangePassword(true)
                        .lastPasswordChangedAt(LocalDateTime.now())
                        .build());
        authEventService.record(
                user,
                normalizeRequiredEmail(user.getEmail()),
                AuthEventType.LOCAL_CREDENTIALS_CREATED,
                UserLoginMethod.LOCAL,
                null);

        return toUserDetail(user, activeRole.getRole().getCode());
    }

    @Transactional
    public UserDetailResponse resetLocalPassword(Long id, String temporaryPassword) {
        User user = getManagedUser(id);
        UserRole activeRole = getActiveRole(user.getId());
        validateLocalCredentialEligibleRole(activeRole.getRole().getCode());
        LocalAuthCredential credential =
                localAuthCredentialRepository
                        .findByUserId(user.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Local credentials not found for user id: " + id));

        credential.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        credential.setMustChangePassword(true);
        credential.setFailedAttemptCount(0);
        credential.setLockedUntil(null);
        credential.setLastPasswordChangedAt(LocalDateTime.now());
        localAuthCredentialRepository.save(credential);
        authEventService.record(
                user,
                normalizeRequiredEmail(user.getEmail()),
                AuthEventType.LOCAL_PASSWORD_RESET,
                UserLoginMethod.LOCAL,
                null);

        return toUserDetail(user, activeRole.getRole().getCode());
    }

    @Transactional
    public UserDetailResponse deleteLocalCredentials(Long id) {
        User user = getManagedUser(id);
        UserRole activeRole = getActiveRole(user.getId());
        boolean hadCredentials = localAuthCredentialRepository.existsByUserId(user.getId());
        localAuthCredentialRepository.deleteByUserId(user.getId());
        if (hadCredentials) {
            authEventService.record(
                    user,
                    normalizeRequiredEmail(user.getEmail()),
                    AuthEventType.LOCAL_CREDENTIALS_DELETED,
                    UserLoginMethod.LOCAL,
                    null);
        }
        return toUserDetail(user, activeRole.getRole().getCode());
    }

    private User getManagedUser(Long id) {
        return userRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for id: " + id));
    }

    private UserRole getActiveRole(Long userId) {
        return userRoleRepository
                .findActiveByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Active role not found for user id: " + userId));
    }

    private void validateAdminAvailability(User user, RoleCode roleCode, UserStatus newStatus) {
        if (roleCode != RoleCode.ADMIN || newStatus == UserStatus.ACTIVE) {
            return;
        }

        long activeAdmins =
                userRoleRepository.countActiveUsersByRoleAndStatus(RoleCode.ADMIN, UserStatus.ACTIVE);
        if (user.getStatus() == UserStatus.ACTIVE && activeAdmins <= 1) {
            throw new IllegalArgumentException("At least one active admin must remain in the system");
        }
    }

    private String normalizeSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        return search.trim().toLowerCase();
    }

    private String normalizeRequiredEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private Map<String, Object> buildUserSnapshot(User user) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("email", user.getEmail());
        snapshot.put("firstName", user.getFirstName());
        snapshot.put("lastName", user.getLastName());
        snapshot.put("displayName", user.getDisplayName());
        snapshot.put("phone", user.getPhone());
        snapshot.put("profileImageUrl", user.getProfileImageUrl());
        snapshot.put("status", user.getStatus() == null ? null : user.getStatus().name());
        return snapshot;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void validateManagedRole(RoleCode roleCode) {
        if (roleCode == RoleCode.STUDENT) {
            throw new IllegalArgumentException("Students are created through Google sign-in, not admin user creation");
        }
    }

    private void validateLocalCredentialEligibleRole(RoleCode roleCode) {
        if (roleCode == RoleCode.STUDENT) {
            throw new IllegalArgumentException("Student accounts cannot receive local credentials");
        }
    }

    private UserDetailResponse toUserDetail(User user, RoleCode role) {
        LocalAuthCredential credential = localAuthCredentialRepository.findByUserId(user.getId()).orElse(null);
        return userMapper.toDetail(
                user,
                role,
                credential != null,
                credential != null && credential.isMustChangePassword(),
                resolveLoginMethod(role));
    }

    private UserLoginMethod resolveLoginMethod(RoleCode role) {
        return role == RoleCode.STUDENT ? UserLoginMethod.GOOGLE : UserLoginMethod.LOCAL;
    }
}
