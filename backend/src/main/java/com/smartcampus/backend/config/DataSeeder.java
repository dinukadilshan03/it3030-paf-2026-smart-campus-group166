package com.smartcampus.backend.config;

import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.enums.OAuthProvider;
import com.smartcampus.backend.common.enums.RoleType;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.common.repository.RoleRepository;
import com.smartcampus.backend.common.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap-admin.name:Smart Campus Admin}")
    private String adminName;

    @Value("${app.bootstrap-admin.email:admin@smartcampus.local}")
    private String adminEmail;

    @Value("${app.bootstrap-admin.password:Admin@12345}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        for (RoleType roleType : RoleType.values()) {
            roleRepository.findByRoleName(roleType.name())
                    .orElseGet(() -> roleRepository.save(Role.builder()
                            .roleName(roleType.name())
                            .description(roleType.name() + " role")
                            .build()));
        }

        Role adminRole = roleRepository.findByRoleName(RoleType.ADMIN.name())
                .orElseThrow();

        userRepository.findByEmail(adminEmail)
                .orElseGet(() -> userRepository.save(User.builder()
                        .name(adminName)
                        .email(adminEmail)
                        .passwordHash(passwordEncoder.encode(adminPassword))
                        .role(adminRole)
                        .oauthProvider(OAuthProvider.LOCAL)
                        .status(UserStatus.ACTIVE)
                        .build()));
    }
}
