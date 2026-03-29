package com.smartcampus.backend.common.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class UpdateUserRequestDTO {
    @Size(max = 120, message = "Name must be at most 120 characters")
    private String name;

    @Email(message = "Email format is invalid")
    @Size(max = 120, message = "Email must be at most 120 characters")
    private String email;

    @Size(max = 120, message = "Department must be at most 120 characters")
    private String department;

    @Size(max = 30, message = "Phone must be at most 30 characters")
    @Pattern(regexp = "^[+0-9()\\-\\s]*$", message = "Phone format is invalid")
    private String phone;
}
