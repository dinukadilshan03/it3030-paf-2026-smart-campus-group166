package com.smartcampus.backend.modules.auth.service;

import com.smartcampus.backend.common.dto.CreateUserRequestDTO;
import com.smartcampus.backend.common.dto.UpdateUserRequestDTO;
import com.smartcampus.backend.common.dto.UserResponseDTO;
import com.smartcampus.backend.common.enums.RoleType;
import com.smartcampus.backend.common.enums.UserStatus;

import java.util.List;

public interface UserService {

    UserResponseDTO createUser(CreateUserRequestDTO request);

    List<UserResponseDTO> getUsers(String role, String status, String search);

    UserResponseDTO getUserById(Long id);

    UserResponseDTO updateUser(Long id, UpdateUserRequestDTO request);

    UserResponseDTO updateUserRole(Long id, RoleType roleType);

    UserResponseDTO updateUserStatus(Long id, UserStatus status);
}
