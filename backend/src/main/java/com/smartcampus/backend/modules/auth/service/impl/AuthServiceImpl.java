package com.smartcampus.backend.modules.auth.service.impl;

import com.smartcampus.backend.common.dto.UserResponseDTO;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.mapper.UserMapper;
import com.smartcampus.backend.common.repository.UserRepository;
import com.smartcampus.backend.modules.auth.dto.CurrentUserResponseDTO;
import com.smartcampus.backend.modules.auth.dto.LoginRequestDTO;
import com.smartcampus.backend.modules.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;

    @Override
    public CurrentUserResponseDTO login(LoginRequestDTO request, HttpServletRequest httpRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        httpRequest.getSession(true).setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                context
        );

        return buildCurrentUserResponse(authentication.getName());
    }

    @Override
    public CurrentUserResponseDTO getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return CurrentUserResponseDTO.builder()
                    .authenticated(false)
                    .user(null)
                    .build();
        }

        return buildCurrentUserResponse(authentication.getName());
    }

    @Override
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    private CurrentUserResponseDTO buildCurrentUserResponse(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Authenticated user no longer exists"));
        UserResponseDTO response = UserMapper.toDTO(user);
        return CurrentUserResponseDTO.builder()
                .authenticated(true)
                .user(response)
                .build();
    }
}
