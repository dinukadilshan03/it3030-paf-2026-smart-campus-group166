package com.smartcampus.backend.modules.auth.service.impl;



import com.smartcampus.backend.common.dto.CreateUserRequestDTO;
import com.smartcampus.backend.common.dto.UpdateUserRequestDTO;
import com.smartcampus.backend.common.dto.UserResponseDTO;
import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.enums.OAuthProvider;
import com.smartcampus.backend.common.enums.RoleType;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.common.exception.DuplicateResourceException;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.common.mapper.UserMapper;
import com.smartcampus.backend.common.repository.RoleRepository;
import com.smartcampus.backend.common.repository.UserRepository;
import com.smartcampus.backend.modules.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserResponseDTO createUser(CreateUserRequestDTO request) {

        // 1. Check if user already exists (mapped to HTTP 409 by global handler).
        userRepository.findByEmail(request.getEmail())
                .ifPresent(user -> {
                throw new DuplicateResourceException("User already exists with this email");
                });

        // 2. Resolve RoleType enum to stored roleName in roles table.
        Role role = roleRepository.findByRoleName(request.getRole().name())
            .orElseThrow(() -> new ResourceNotFoundException("Role not found for roleName: " + request.getRole().name()));

        // 3. Create User entity
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .department(request.getDepartment())
                .phone(request.getPhone())
                .oauthProvider(OAuthProvider.LOCAL)
                .status(UserStatus.ACTIVE)
                .build();

        // 4. Save to DB
        User savedUser = userRepository.save(user);

        // 5. Convert to DTO
        return UserMapper.toDTO(savedUser);
    }

    @Override
    public List<UserResponseDTO> getUsers(String role, String status, String search) {
        String normalizedRole = role == null ? null : role.trim().toUpperCase();
        String normalizedStatus = status == null ? null : status.trim().toUpperCase();
        String normalizedSearch = search == null ? null : search.trim().toLowerCase();

        return userRepository.findAll().stream()
                .filter(user -> normalizedRole == null || normalizedRole.isBlank()
                        || (user.getRole() != null && normalizedRole.equals(user.getRole().getRoleName())))
                .filter(user -> normalizedStatus == null || normalizedStatus.isBlank()
                        || (user.getStatus() != null && normalizedStatus.equals(user.getStatus().name())))
                .filter(user -> normalizedSearch == null || normalizedSearch.isBlank()
                        || user.getName().toLowerCase().contains(normalizedSearch)
                        || user.getEmail().toLowerCase().contains(normalizedSearch))
                .sorted(Comparator.comparing(User::getName, String.CASE_INSENSITIVE_ORDER))
                .map(UserMapper::toDTO)
                .toList();
    }

    @Override
    public UserResponseDTO getUserById(Long id) {

        User user = getManagedUser(id);

        return UserMapper.toDTO(user);
    }

    @Override
    public UserResponseDTO updateUser(Long id, UpdateUserRequestDTO request) {
        User user = getManagedUser(id);

        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            userRepository.findByEmail(request.getEmail())
                    .filter(existing -> !existing.getUserId().equals(id))
                    .ifPresent(existing -> {
                        throw new DuplicateResourceException("User already exists with this email");
                    });
            user.setEmail(request.getEmail());
        }

        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        return UserMapper.toDTO(userRepository.save(user));
    }

    @Override
    public UserResponseDTO updateUserRole(Long id, RoleType roleType) {
        User user = getManagedUser(id);
        user.setRole(resolveRole(roleType));
        return UserMapper.toDTO(userRepository.save(user));
    }

    @Override
    public UserResponseDTO updateUserStatus(Long id, UserStatus status) {
        User user = getManagedUser(id);
        validateAdminAvailability(user, status);
        user.setStatus(status);
        return UserMapper.toDTO(userRepository.save(user));
    }

    private User getManagedUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for id: " + id));
    }

    private Role resolveRole(RoleType roleType) {
        return roleRepository.findByRoleName(roleType.name())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found for roleName: " + roleType.name()));
    }

    private void validateAdminAvailability(User user, UserStatus newStatus) {
        if (user.getRole() == null || !"ADMIN".equals(user.getRole().getRoleName())) {
            return;
        }
        if (newStatus == UserStatus.ACTIVE) {
            return;
        }

        long activeAdmins = userRepository.countByRole_RoleNameAndStatus("ADMIN", UserStatus.ACTIVE);
        if (user.getStatus() == UserStatus.ACTIVE && activeAdmins <= 1) {
            throw new IllegalArgumentException("At least one active admin must remain in the system");
        }
    }
}
