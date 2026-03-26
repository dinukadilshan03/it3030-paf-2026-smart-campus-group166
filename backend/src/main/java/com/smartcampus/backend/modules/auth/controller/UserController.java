package com.smartcampus.backend.modules.auth.controller;

import com.smartcampus.backend.modules.auth.service.UserService;
import com.smartcampus.backend.common.dto.CreateUserRequestDTO;
import com.smartcampus.backend.common.dto.UserResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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

    // GET USER BY ID
    @GetMapping("/{id}")
    public UserResponseDTO getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }
}