package com.smartcampus.backend.modules.auth.service;

import com.smartcampus.backend.modules.auth.dto.CurrentUserResponseDTO;
import com.smartcampus.backend.modules.auth.dto.LoginRequestDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {

    CurrentUserResponseDTO login(LoginRequestDTO request, HttpServletRequest httpRequest);

    CurrentUserResponseDTO getCurrentUser();

    void logout(HttpServletRequest request, HttpServletResponse response);
}
