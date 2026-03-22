package com.smartcampus.backend.modules.auth.service.impl;



import com.smartcampus.backend.common.dto.CreateUserRequestDTO;
import com.smartcampus.backend.common.dto.UserResponseDTO;
import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.common.exception.DuplicateResourceException;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.common.repository.RoleRepository;
import com.smartcampus.backend.common.repository.UserRepository;
import com.smartcampus.backend.common.mapper.UserMapper;
import com.smartcampus.backend.modules.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

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
                .role(role)
                .department(request.getDepartment())
                .phone(request.getPhone())
                .status(UserStatus.ACTIVE)
                .build();

        // 4. Save to DB
        User savedUser = userRepository.save(user);

        // 5. Convert to DTO
        return UserMapper.toDTO(savedUser);
    }

    @Override
    public UserResponseDTO getUserById(Long id) {

        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found for id: " + id));

        return UserMapper.toDTO(user);
    }
}
