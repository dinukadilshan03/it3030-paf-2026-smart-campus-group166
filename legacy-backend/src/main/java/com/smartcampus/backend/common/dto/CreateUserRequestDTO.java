package com.smartcampus.backend.common.dto;

import com.smartcampus.backend.common.enums.RoleType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateUserRequestDTO {

    @NotBlank(message = "Name is required")
    @Size(max = 120, message = "Name must be at most 120 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email format is invalid")
    @Size(max = 120, message = "Email must be at most 120 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    private String password;

    @NotNull(message = "Role is required")
    // Enum input blocks invalid free-form role strings at the API boundary.
    private RoleType role;

    @Size(max = 120, message = "Department must be at most 120 characters")
    private String department;

    @Size(max = 30, message = "Phone must be at most 30 characters")
    @Pattern(regexp = "^[+0-9()\\-\\s]*$", message = "Phone format is invalid")
    private String phone;
}
