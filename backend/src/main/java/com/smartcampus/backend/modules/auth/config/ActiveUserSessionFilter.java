package com.smartcampus.backend.modules.auth.config;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.modules.auth.dto.AuthErrorResponse;
import com.smartcampus.backend.modules.auth.exception.AuthFailureCode;
import com.smartcampus.backend.modules.auth.repository.LocalAuthCredentialRepository;
import com.smartcampus.backend.modules.auth.service.AuthenticatedEmailResolver;
import com.smartcampus.backend.modules.user.repository.UserRepository;
import com.smartcampus.backend.modules.user.repository.UserRoleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Slf4j
@Component
@RequiredArgsConstructor
public class ActiveUserSessionFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final LocalAuthCredentialRepository localAuthCredentialRepository;
    private final AuthenticatedEmailResolver authenticatedEmailResolver;
    private final ObjectMapper objectMapper;
    private final SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getServletPath().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!authenticatedEmailResolver.isAuthenticated(authentication)) {
            filterChain.doFilter(request, response);
            return;
        }

        String email = authenticatedEmailResolver.resolveAuthenticatedEmail(authentication);
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            log.warn("Authenticated session has no local user record for email={}", email);
            logoutHandler.logout(request, response, authentication);
            writeAuthError(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    AuthFailureCode.PROVISIONING_FAILED,
                    "Authenticated session could not be linked to a local user");
            return;
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            log.warn("Authenticated session blocked for email={} status={}", email, user.getStatus());
            logoutHandler.logout(request, response, authentication);
            writeAuthError(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    AuthFailureCode.ACCOUNT_BLOCKED,
                    "Account is no longer active");
            return;
        }

        UserRole membership = userRoleRepository.findActiveByUserId(user.getId()).orElse(null);
        if (membership == null) {
            log.warn("Authenticated session has no active role for email={}", email);
            logoutHandler.logout(request, response, authentication);
            writeAuthError(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    AuthFailureCode.PROVISIONING_FAILED,
                    "Authenticated session could not be linked to an active role");
            return;
        }

        RoleCode activeRole = membership.getRole().getCode();
        boolean googleAuthentication = authenticatedEmailResolver.isGoogleAuthentication(authentication);

        if (googleAuthentication && activeRole != RoleCode.STUDENT) {
            log.warn("Google session rejected for non-student role={} email={}", activeRole, email);
            logoutHandler.logout(request, response, authentication);
            writeAuthError(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    AuthFailureCode.OAUTH_NOT_ALLOWED,
                    "Google sign-in is not available for this account");
            return;
        }

        if (!googleAuthentication && activeRole == RoleCode.STUDENT) {
            log.warn("Local session rejected for student email={}", email);
            logoutHandler.logout(request, response, authentication);
            writeAuthError(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    AuthFailureCode.LOCAL_LOGIN_NOT_ALLOWED,
                    "Email and password sign-in is not available for student accounts");
            return;
        }

        if (!googleAuthentication
                && localAuthCredentialRepository.findByUserId(user.getId()).map(credential -> credential.isMustChangePassword()).orElse(false)
                && !isPasswordChangeAllowedPath(request.getServletPath())) {
            writeAuthError(
                    response,
                    HttpServletResponse.SC_FORBIDDEN,
                    AuthFailureCode.PASSWORD_CHANGE_REQUIRED,
                    "You must change your temporary password before continuing");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPasswordChangeAllowedPath(String servletPath) {
        return servletPath.equals("/api/v1/auth/me")
                || servletPath.equals("/api/v1/auth/change-password")
                || servletPath.equals("/api/v1/auth/logout");
    }

    private void writeAuthError(
            HttpServletResponse response,
            int status,
            AuthFailureCode failureCode,
            String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter()
                .write(
                        objectMapper.writeValueAsString(
                                new AuthErrorResponse(failureCode.getQueryValue(), message)));
    }
}
