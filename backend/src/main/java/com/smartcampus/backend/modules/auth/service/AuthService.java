package com.smartcampus.backend.modules.auth.service;

import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.modules.auth.dto.CurrentUserResponse;
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
    private final SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();

    public CurrentUserResponse getCurrentUser() {
        Optional<UserRole> membership = currentUserService.getCurrentUserRole();
        if (membership.isEmpty()) {
            return userMapper.anonymousCurrentUser();
        }

        UserRole currentRole = membership.get();
        return userMapper.toCurrentUser(currentRole.getUser(), currentRole.getRole().getCode());
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        logoutHandler.logout(request, response, null);
    }
}
