package com.smartcampus.backend.common.mapper;

import com.smartcampus.backend.common.dto.UserResponseDTO;
import com.smartcampus.backend.common.entity.User;

public class UserMapper {

    // Defensive mapping to avoid null-related failures in API responses.
    public static UserResponseDTO toDTO(User user) {
        if (user == null) {
            return null;
        }

        return UserResponseDTO.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().getRoleName() : null)
                .department(user.getDepartment())
                .phone(user.getPhone())
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .build();
    }
}