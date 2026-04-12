package com.smartcampus.backend.modules.auth.controller;

import com.smartcampus.backend.common.dto.UpdateUserRequestDTO;
import com.smartcampus.backend.modules.auth.service.UserService;
import com.smartcampus.backend.common.dto.CreateUserRequestDTO;
import com.smartcampus.backend.common.dto.UserResponseDTO;
import com.smartcampus.backend.common.enums.RoleType;
import com.smartcampus.backend.common.enums.UserStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // CREATE USER
    // @Valid enforces bean validation before calling the service layer.
    @PostMapping
    public UserResponseDTO createUser(@Valid @RequestBody CreateUserRequestDTO request) {
        return userService.createUser(request);
    }

    @GetMapping
    public List<UserResponseDTO> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search
    ) {
        return userService.getUsers(role, status, search);
    }

    // GET USER BY ID
    @GetMapping("/{id}")
    public UserResponseDTO getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @PutMapping("/{id}")
    public UserResponseDTO updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequestDTO request) {
        return userService.updateUser(id, request);
    }

    @PatchMapping("/{id}/role")
    public UserResponseDTO updateUserRole(@PathVariable Long id, @RequestParam RoleType role) {
        return userService.updateUserRole(id, role);
    }

    @PatchMapping("/{id}/status")
    public UserResponseDTO updateUserStatus(@PathVariable Long id, @RequestParam UserStatus status) {
        return userService.updateUserStatus(id, status);
    }
}
