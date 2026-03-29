package com.smartcampus.backend.modules.auth.dto;

import com.smartcampus.backend.common.dto.UserResponseDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class CurrentUserResponseDTO {
    private boolean authenticated;
    private UserResponseDTO user;
}
