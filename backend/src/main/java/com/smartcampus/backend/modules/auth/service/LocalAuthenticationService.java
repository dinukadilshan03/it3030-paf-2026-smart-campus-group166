package com.smartcampus.backend.modules.auth.service;

import com.smartcampus.backend.common.entity.LocalAuthCredential;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.AuthEventType;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.common.enums.UserLoginMethod;
import com.smartcampus.backend.modules.auth.exception.AuthFailureCode;
import com.smartcampus.backend.modules.auth.exception.AuthFlowException;
import com.smartcampus.backend.modules.auth.repository.LocalAuthCredentialRepository;
import com.smartcampus.backend.modules.user.repository.UserRoleRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LocalAuthenticationService {

    private final UserRoleRepository userRoleRepository;
    private final LocalAuthCredentialRepository localAuthCredentialRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityContextRepository securityContextRepository;
    private final AuthEventService authEventService;

    @Value("${app.auth.local.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${app.auth.local.lock-duration-minutes:15}")
    private long lockDurationMinutes;

    @Transactional
    public UserRole login(
            String rawEmail,
            String rawPassword,
            HttpServletRequest request,
            HttpServletResponse response) {
        String email = normalizeEmail(rawEmail);
        UserRole membership = userRoleRepository.findActiveByUserEmail(email).orElse(null);
        if (membership == null) {
            authEventService.record(
                    null,
                    email,
                    AuthEventType.LOGIN_FAILURE,
                    UserLoginMethod.LOCAL,
                    AuthFailureCode.INVALID_CREDENTIALS.getQueryValue());
            throw invalidCredentials();
        }

        User user = membership.getUser();
        if (user.getStatus() != UserStatus.ACTIVE) {
            authEventService.record(
                    user,
                    email,
                    AuthEventType.LOGIN_FAILURE,
                    UserLoginMethod.LOCAL,
                    AuthFailureCode.ACCOUNT_BLOCKED.getQueryValue());
            throw new AuthFlowException(
                    AuthFailureCode.ACCOUNT_BLOCKED, "This account is not allowed to sign in");
        }

        if (membership.getRole().getCode() == RoleCode.STUDENT) {
            throw new AuthFlowException(
                    AuthFailureCode.LOCAL_LOGIN_NOT_ALLOWED,
                    "Email and password sign-in is only available for staff and admin accounts");
        }

        LocalAuthCredential credential =
                localAuthCredentialRepository.findByUserId(user.getId()).orElse(null);
        if (credential == null) {
            authEventService.record(
                    user,
                    email,
                    AuthEventType.LOGIN_FAILURE,
                    UserLoginMethod.LOCAL,
                    AuthFailureCode.INVALID_CREDENTIALS.getQueryValue());
            throw invalidCredentials();
        }

        if (isLocked(credential)) {
            authEventService.record(
                    user,
                    email,
                    AuthEventType.ACCOUNT_LOCKED,
                    UserLoginMethod.LOCAL,
                    AuthFailureCode.INVALID_CREDENTIALS.getQueryValue());
            throw invalidCredentials();
        }

        if (!passwordEncoder.matches(rawPassword, credential.getPasswordHash())) {
            boolean accountLocked = registerFailedAttempt(credential);
            authEventService.record(
                    user,
                    email,
                    AuthEventType.LOGIN_FAILURE,
                    UserLoginMethod.LOCAL,
                    AuthFailureCode.INVALID_CREDENTIALS.getQueryValue());
            if (accountLocked) {
                authEventService.record(
                        user,
                        email,
                        AuthEventType.ACCOUNT_LOCKED,
                        UserLoginMethod.LOCAL,
                        AuthFailureCode.INVALID_CREDENTIALS.getQueryValue());
            }
            throw invalidCredentials();
        }

        credential.setFailedAttemptCount(0);
        credential.setLockedUntil(null);
        localAuthCredentialRepository.save(credential);

        user.setLastLoginAt(LocalDateTime.now());
        establishSession(request, response, membership);
        authEventService.record(
                user,
                email,
                AuthEventType.LOGIN_SUCCESS,
                UserLoginMethod.LOCAL,
                null);
        return membership;
    }

    @Transactional
    public void changePassword(
            UserRole membership,
            String currentPassword,
            String newPassword,
            HttpServletRequest request,
            HttpServletResponse response) {
        if (membership.getRole().getCode() == RoleCode.STUDENT) {
            throw new AuthFlowException(
                    AuthFailureCode.LOCAL_LOGIN_NOT_ALLOWED,
                    "Student accounts do not support local password changes");
        }

        LocalAuthCredential credential =
                localAuthCredentialRepository
                        .findByUserId(membership.getUser().getId())
                        .orElseThrow(this::invalidCredentials);

        if (!passwordEncoder.matches(currentPassword, credential.getPasswordHash())) {
            throw invalidCredentials();
        }

        credential.setPasswordHash(passwordEncoder.encode(newPassword));
        credential.setMustChangePassword(false);
        credential.setFailedAttemptCount(0);
        credential.setLockedUntil(null);
        credential.setLastPasswordChangedAt(LocalDateTime.now());
        localAuthCredentialRepository.save(credential);

        establishSession(request, response, membership);
        authEventService.record(
                membership.getUser(),
                normalizeEmail(membership.getUser().getEmail()),
                AuthEventType.PASSWORD_CHANGED,
                UserLoginMethod.LOCAL,
                null);
    }

    private void establishSession(
            HttpServletRequest request, HttpServletResponse response, UserRole membership) {
        var authentication =
                UsernamePasswordAuthenticationToken.authenticated(
                        membership.getUser().getEmail(),
                        null,
                        List.of(
                                new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                        "ROLE_" + membership.getRole().getCode().name())));
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        request.getSession(true);
        securityContextRepository.saveContext(context, request, response);
    }

    private boolean isLocked(LocalAuthCredential credential) {
        return credential.getLockedUntil() != null
                && credential.getLockedUntil().isAfter(LocalDateTime.now());
    }

    private boolean registerFailedAttempt(LocalAuthCredential credential) {
        int failedAttempts = credential.getFailedAttemptCount() + 1;
        credential.setFailedAttemptCount(failedAttempts);
        boolean accountLocked = false;
        if (failedAttempts >= Math.max(1, maxFailedAttempts)) {
            credential.setLockedUntil(LocalDateTime.now().plusMinutes(Math.max(1, lockDurationMinutes)));
            credential.setFailedAttemptCount(0);
            accountLocked = true;
        }
        localAuthCredentialRepository.save(credential);
        return accountLocked;
    }

    private AuthFlowException invalidCredentials() {
        return new AuthFlowException(
                AuthFailureCode.INVALID_CREDENTIALS, "Invalid email or password");
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
