package com.smartcampus.backend.modules.auth.service;

import com.smartcampus.backend.common.entity.LocalAuthCredential;
import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.modules.auth.repository.LocalAuthCredentialRepository;
import com.smartcampus.backend.modules.user.repository.RoleRepository;
import com.smartcampus.backend.modules.user.repository.UserRepository;
import com.smartcampus.backend.modules.user.repository.UserRoleRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class BootstrapLocalAdminInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
    private final LocalAuthCredentialRepository localAuthCredentialRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap-admin.email:}")
    private String bootstrapAdminEmail;

    @Value("${app.bootstrap-admin.temp-password:}")
    private String bootstrapAdminTempPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (bootstrapAdminEmail == null || bootstrapAdminEmail.isBlank()) {
            return;
        }

        if (bootstrapAdminTempPassword == null || bootstrapAdminTempPassword.isBlank()) {
            log.info("Bootstrap admin email configured without a temp password; skipping local admin bootstrap");
            return;
        }

        String email = bootstrapAdminEmail.trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(User::new);
        boolean createdUser = user.getId() == null;

        user.setEmail(email);
        user.setStatus(UserStatus.ACTIVE);
        if (user.getDisplayName() == null || user.getDisplayName().isBlank()) {
            user.setDisplayName("Bootstrap Admin");
        }
        User savedUser = userRepository.save(user);

        ensureAdminRole(savedUser);
        ensureLocalCredentials(savedUser);

        log.info(
                "Bootstrap local admin {} for email={}",
                createdUser ? "initialized" : "verified",
                savedUser.getEmail());
    }

    private void ensureAdminRole(User user) {
        Role adminRole =
                roleRepository
                        .findByCode(RoleCode.ADMIN)
                        .orElseThrow(() -> new ResourceNotFoundException("Role not found for code: ADMIN"));
        UserRole currentRole = userRoleRepository.findActiveByUserId(user.getId()).orElse(null);
        if (currentRole != null && currentRole.getRole().getCode() == RoleCode.ADMIN) {
            return;
        }

        if (currentRole != null) {
            currentRole.setIsActive(false);
            currentRole.setEndedAt(LocalDateTime.now());
            userRoleRepository.save(currentRole);
        }

        userRoleRepository.save(UserRole.builder().user(user).role(adminRole).isActive(true).build());
    }

    private void ensureLocalCredentials(User user) {
        if (localAuthCredentialRepository.existsByUserId(user.getId())) {
            return;
        }

        localAuthCredentialRepository.save(
                LocalAuthCredential.builder()
                        .user(user)
                        .passwordHash(passwordEncoder.encode(bootstrapAdminTempPassword))
                        .mustChangePassword(true)
                        .lastPasswordChangedAt(LocalDateTime.now())
                        .build());
    }
}
