package com.smartcampus.backend.modules.profile.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.common.entity.LocalAuthCredential;
import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.UserLoginMethod;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.modules.auth.repository.LocalAuthCredentialRepository;
import com.smartcampus.backend.modules.auth.service.CurrentUserService;
import com.smartcampus.backend.modules.profile.dto.UpdateProfileRequest;
import com.smartcampus.backend.modules.user.mapper.UserMapper;
import com.smartcampus.backend.modules.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock private CurrentUserService currentUserService;
    @Mock private LocalAuthCredentialRepository localAuthCredentialRepository;
    @Mock private UserRepository userRepository;

    private ProfileService profileService;

    @BeforeEach
    void setUp() {
        profileService =
                new ProfileService(
                        currentUserService,
                        localAuthCredentialRepository,
                        userRepository,
                        new UserMapper());
    }

    @Test
    void returnsStudentProfileWithGoogleLoginState() {
        User user =
                User.builder()
                        .id(1L)
                        .email("student@example.com")
                        .firstName("Student")
                        .lastName("User")
                        .status(UserStatus.ACTIVE)
                        .build();
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        UserRole membership =
                UserRole.builder()
                        .user(user)
                        .role(Role.builder().code(RoleCode.STUDENT).name("Student").build())
                        .isActive(true)
                        .build();

        when(currentUserService.getCurrentUserRole()).thenReturn(Optional.of(membership));
        when(localAuthCredentialRepository.findByUserId(1L)).thenReturn(Optional.empty());

        var result = profileService.getCurrentProfile();

        assertThat(result.role()).isEqualTo(RoleCode.STUDENT);
        assertThat(result.loginMethod()).isEqualTo(UserLoginMethod.GOOGLE);
        assertThat(result.hasLocalCredentials()).isFalse();
    }

    @Test
    void returnsStaffProfileWithCredentialState() {
        User user =
                User.builder()
                        .id(2L)
                        .email("staff@example.com")
                        .displayName("Staff User")
                        .status(UserStatus.ACTIVE)
                        .build();
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        UserRole membership =
                UserRole.builder()
                        .user(user)
                        .role(Role.builder().code(RoleCode.STAFF).name("Staff").build())
                        .isActive(true)
                        .build();
        LocalAuthCredential credential =
                LocalAuthCredential.builder()
                        .user(user)
                        .passwordHash("hash")
                        .mustChangePassword(true)
                        .build();

        when(currentUserService.getCurrentUserRole()).thenReturn(Optional.of(membership));
        when(localAuthCredentialRepository.findByUserId(2L)).thenReturn(Optional.of(credential));

        var result = profileService.getCurrentProfile();

        assertThat(result.loginMethod()).isEqualTo(UserLoginMethod.LOCAL);
        assertThat(result.hasLocalCredentials()).isTrue();
        assertThat(result.mustChangePassword()).isTrue();
    }

    @Test
    void updatesOnlySelfEditableFields() {
        User user =
                User.builder()
                        .id(3L)
                        .email("admin@example.com")
                        .firstName("Old")
                        .lastName("Admin")
                        .displayName("Old Admin")
                        .phone("123")
                        .status(UserStatus.ACTIVE)
                        .build();
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        UserRole membership =
                UserRole.builder()
                        .user(user)
                        .role(Role.builder().code(RoleCode.ADMIN).name("Admin").build())
                        .isActive(true)
                        .build();
        LocalAuthCredential credential =
                LocalAuthCredential.builder().user(user).passwordHash("hash").mustChangePassword(false).build();

        when(currentUserService.getCurrentUserRole()).thenReturn(Optional.of(membership));
        when(userRepository.save(user)).thenReturn(user);
        when(localAuthCredentialRepository.findByUserId(3L)).thenReturn(Optional.of(credential));

        var result =
                profileService.updateCurrentProfile(
                        new UpdateProfileRequest(
                                "  New  ", "  Owner ", "  New Admin ", " ", "  https://example.com/a.png  "));

        assertThat(user.getFirstName()).isEqualTo("New");
        assertThat(user.getLastName()).isEqualTo("Owner");
        assertThat(user.getDisplayName()).isEqualTo("New Admin");
        assertThat(user.getPhone()).isNull();
        assertThat(user.getProfileImageUrl()).isEqualTo("https://example.com/a.png");
        assertThat(result.role()).isEqualTo(RoleCode.ADMIN);
        assertThat(result.email()).isEqualTo("admin@example.com");
    }

    @Test
    void rejectsAnonymousProfileAccess() {
        when(currentUserService.getCurrentUserRole()).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.getCurrentProfile())
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Authenticated user context is required");
    }
}
