package com.smartcampus.backend.modules.auth.config;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.modules.auth.dto.AuthErrorResponse;
import com.smartcampus.backend.modules.auth.exception.AuthFailureCode;
import com.smartcampus.backend.modules.auth.service.AuthenticatedEmailResolver;
import com.smartcampus.backend.modules.user.repository.UserRepository;
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
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter()
                    .write(
                            objectMapper.writeValueAsString(
                                    new AuthErrorResponse(
                                            AuthFailureCode.PROVISIONING_FAILED.getQueryValue(),
                                            "Authenticated session could not be linked to a local user")));
            return;
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            log.warn("Authenticated session blocked for email={} status={}", email, user.getStatus());
            logoutHandler.logout(request, response, authentication);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter()
                    .write(
                            objectMapper.writeValueAsString(
                                    new AuthErrorResponse(
                                            AuthFailureCode.ACCOUNT_BLOCKED.getQueryValue(),
                                            "Account is no longer active")));
            return;
        }

        filterChain.doFilter(request, response);
    }
}
