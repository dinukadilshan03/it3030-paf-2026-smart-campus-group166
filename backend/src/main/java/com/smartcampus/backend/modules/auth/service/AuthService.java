package com.smartcampus.backend.modules.auth.service;

import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.modules.auth.dto.ChangePasswordRequest;
import com.smartcampus.backend.modules.auth.dto.CurrentUserResponse;
import com.smartcampus.backend.modules.auth.dto.LoginRequest;
import com.smartcampus.backend.modules.auth.exception.AuthFailureCode;
import com.smartcampus.backend.modules.auth.exception.AuthFlowException;
import com.smartcampus.backend.modules.auth.repository.LocalAuthCredentialRepository;
import com.smartcampus.backend.modules.user.mapper.UserMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final CurrentUserService currentUserService;
    private final UserMapper userMapper;
    private final LocalAuthenticationService localAuthenticationService;
    private final LocalAuthCredentialRepository localAuthCredentialRepository;
    private final SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();

    public CurrentUserResponse getCurrentUser() {
        Optional<UserRole> membership = currentUserService.getCurrentUserRole();
        if (membership.isEmpty()) {
            return userMapper.anonymousCurrentUser();
        }

        UserRole currentRole = membership.get();
        boolean passwordChangeRequired =
                localAuthCredentialRepository
                        .findByUserId(currentRole.getUser().getId())
                        .map(credential -> credential.isMustChangePassword())
                        .orElse(false);
        return userMapper.toCurrentUser(
                currentRole.getUser(), currentRole.getRole().getCode(), passwordChangeRequired);
    }

    public CurrentUserResponse login(
            LoginRequest request, HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
        UserRole membership =
                localAuthenticationService.login(
                        request.email(), request.password(), httpServletRequest, httpServletResponse);
        boolean passwordChangeRequired =
                localAuthCredentialRepository
                        .findByUserId(membership.getUser().getId())
                        .map(credential -> credential.isMustChangePassword())
                        .orElse(false);
        return userMapper.toCurrentUser(
                membership.getUser(), membership.getRole().getCode(), passwordChangeRequired);
    }

    public void changePassword(
            ChangePasswordRequest request,
            HttpServletRequest httpServletRequest,
            HttpServletResponse httpServletResponse) {
        UserRole membership =
                currentUserService
                        .getCurrentUserRole()
                        .orElseThrow(
                                () ->
                                        new AuthFlowException(
                                                AuthFailureCode.INVALID_CREDENTIALS,
                                                "Authenticated session is required"));
        localAuthenticationService.changePassword(
                membership,
                request.currentPassword(),
                request.newPassword(),
                httpServletRequest,
                httpServletResponse);
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        logoutHandler.logout(request, response, null);
    }
}
