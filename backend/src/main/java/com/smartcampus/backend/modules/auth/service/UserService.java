package com.smartcampus.backend.modules.auth.service;

import com.smartcampus.backend.common.dto.CreateUserRequestDTO;
import com.smartcampus.backend.common.dto.UserResponseDTO;

public interface UserService {

    UserResponseDTO createUser(CreateUserRequestDTO request);

    UserResponseDTO getUserById(Long id);
}