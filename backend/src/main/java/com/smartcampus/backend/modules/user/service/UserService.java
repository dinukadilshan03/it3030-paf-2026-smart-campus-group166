package com.smartcampus.backend.modules.user.service;

import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.modules.user.dto.UpdateUserRequest;
import com.smartcampus.backend.modules.user.dto.UserDetailResponse;
import com.smartcampus.backend.modules.user.dto.UserSummaryResponse;
import com.smartcampus.backend.modules.user.mapper.UserMapper;
import com.smartcampus.backend.modules.user.repository.RoleRepository;
import com.smartcampus.backend.modules.user.repository.UserRepository;
import com.smartcampus.backend.modules.user.repository.UserRoleRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserMapper userMapper;

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

        return users.stream()
                .map(
                        user ->
                                userMapper.toSummary(
                                        user,
                                        activeRoles.get(user.getId()) == null
                                                ? null
                                                : activeRoles.get(user.getId()).getRole().getCode()))
                .toList();
    }

    @Transactional(readOnly = true)
    public UserDetailResponse getUserById(Long id) {
        User user = getManagedUser(id);
        UserRole activeRole = getActiveRole(user.getId());
        return userMapper.toDetail(user, activeRole.getRole().getCode());
    }

    @Transactional
    public UserDetailResponse updateUser(Long id, UpdateUserRequest request) {
        User user = getManagedUser(id);
        userMapper.applyUpdates(
                user,
                request.firstName(),
                request.lastName(),
                request.displayName(),
                request.phone(),
                request.profileImageUrl());

        User savedUser = userRepository.save(user);
        UserRole activeRole = getActiveRole(savedUser.getId());
        return userMapper.toDetail(savedUser, activeRole.getRole().getCode());
    }

    @Transactional
    public UserDetailResponse updateUserRole(Long id, RoleCode roleCode) {
        User user = getManagedUser(id);
        UserRole currentRole = getActiveRole(user.getId());
        if (currentRole.getRole().getCode() != roleCode) {
            currentRole.setIsActive(false);
            currentRole.setEndedAt(LocalDateTime.now());
            userRoleRepository.save(currentRole);

            Role role =
                    roleRepository
                            .findByCode(roleCode)
                            .orElseThrow(() -> new ResourceNotFoundException("Role not found for code: " + roleCode));
            userRoleRepository.save(UserRole.builder().user(user).role(role).isActive(true).build());
        }

        UserRole refreshedRole = getActiveRole(user.getId());
        return userMapper.toDetail(user, refreshedRole.getRole().getCode());
    }

    @Transactional
    public UserDetailResponse updateUserStatus(Long id, UserStatus status) {
        User user = getManagedUser(id);
        UserRole activeRole = getActiveRole(user.getId());
        validateAdminAvailability(user, activeRole.getRole().getCode(), status);
        user.setStatus(status);
        User savedUser = userRepository.save(user);
        return userMapper.toDetail(savedUser, activeRole.getRole().getCode());
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
}
