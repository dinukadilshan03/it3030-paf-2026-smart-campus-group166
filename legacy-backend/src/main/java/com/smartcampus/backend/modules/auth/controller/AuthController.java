package com.smartcampus.backend.modules.auth.controller;

import com.smartcampus.backend.modules.auth.dto.CurrentUserResponseDTO;
import com.smartcampus.backend.modules.auth.dto.LoginRequestDTO;
import com.smartcampus.backend.modules.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public CurrentUserResponseDTO login(
            @Valid @RequestBody LoginRequestDTO request,
            HttpServletRequest httpRequest
    ) {
        return authService.login(request, httpRequest);
    }

    @GetMapping("/me")
    public CurrentUserResponseDTO getCurrentUser() {
        return authService.getCurrentUser();
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(request, response);
    }
}
