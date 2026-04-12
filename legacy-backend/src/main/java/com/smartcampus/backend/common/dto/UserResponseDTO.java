package com.smartcampus.backend.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class UserResponseDTO {

    private Long userId;
    private String name;
    private String email;
    private String role;
    private String department;
    private String phone;
    private String status;
    private String oauthProvider;
    private boolean localAccount;
}
