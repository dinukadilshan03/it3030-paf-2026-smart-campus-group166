package com.smartcampus.backend.common.dto;

import com.smartcampus.backend.common.enums.UserStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class UpdateUserRequestDTO {
    private String name;
    private String department;
    private String phone;
    // Only known status values are accepted through enum binding.
    private UserStatus status;
}
