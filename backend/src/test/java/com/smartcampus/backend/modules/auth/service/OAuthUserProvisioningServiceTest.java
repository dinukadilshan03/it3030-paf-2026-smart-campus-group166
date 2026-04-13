package com.smartcampus.backend.modules.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.modules.auth.exception.AuthFlowException;
import com.smartcampus.backend.modules.user.repository.RoleRepository;
import com.smartcampus.backend.modules.user.repository.UserRepository;
import com.smartcampus.backend.modules.user.repository.UserRoleRepository;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class OAuthUserProvisioningServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private UserRoleRepository userRoleRepository;

    @InjectMocks private OAuthUserProvisioningService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "bootstrapAdminEmail", "");
    }

    @Test
    void createsStudentUserOnFirstGoogleLogin() {
        Role studentRole = Role.builder().id(1L).code(RoleCode.STUDENT).name("Student").build();
        User savedUser = User.builder().id(10L).email("student@example.com").status(UserStatus.ACTIVE).build();
        UserRole savedMembership =
                UserRole.builder()
                        .id(20L)
                        .user(savedUser)
                        .role(studentRole)
                        .isActive(true)
                        .build();

        when(userRepository.findByEmailIgnoreCase("student@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByGoogleSub("google-123")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(userRoleRepository.findActiveByUserId(10L)).thenReturn(Optional.empty());
        when(roleRepository.findByCode(RoleCode.STUDENT)).thenReturn(Optional.of(studentRole));
        when(userRoleRepository.save(any(UserRole.class))).thenReturn(savedMembership);

        UserRole result =
                service.provisionFromGoogleAttributes(
                        Map.of(
                                "email", "student@example.com",
                                "sub", "google-123",
                                "name", "Student User",
                                "given_name", "Student",
                                "family_name", "User",
                                "picture", "https://example.com/avatar.png"));

        assertThat(result.getRole().getCode()).isEqualTo(RoleCode.STUDENT);
        assertThat(result.getUser().getEmail()).isEqualTo("student@example.com");
        verify(roleRepository).findByCode(RoleCode.STUDENT);
    }

    @Test
    void preservesExistingActiveRoleOnLaterLogins() {
        User existingUser =
                User.builder()
                        .id(11L)
                        .email("staff@example.com")
                        .googleSub("google-staff")
                        .status(UserStatus.ACTIVE)
                        .build();
        Role staffRole = Role.builder().id(2L).code(RoleCode.STAFF).name("Staff").build();
        UserRole existingMembership =
                UserRole.builder().id(21L).user(existingUser).role(staffRole).isActive(true).build();

        when(userRepository.findByEmailIgnoreCase("staff@example.com")).thenReturn(Optional.of(existingUser));
        when(userRepository.findByGoogleSub("google-staff")).thenReturn(Optional.of(existingUser));
        when(userRepository.save(existingUser)).thenReturn(existingUser);
        when(userRoleRepository.findActiveByUserId(11L)).thenReturn(Optional.of(existingMembership));

        UserRole result =
                service.provisionFromGoogleAttributes(
                        Map.of(
                                "email", "staff@example.com",
                                "sub", "google-staff",
                                "name", "Staff User",
                                "given_name", "Staff",
                                "family_name", "User"));

        assertThat(result.getRole().getCode()).isEqualTo(RoleCode.STAFF);
        assertThat(existingUser.getDisplayName()).isEqualTo("Staff User");
    }

    @Test
    void rejectsGoogleSubLinkedToAnotherUser() {
        User existingUser = User.builder().id(12L).email("one@example.com").build();
        User conflictingUser = User.builder().id(13L).email("two@example.com").googleSub("shared-sub").build();

        when(userRepository.findByEmailIgnoreCase("one@example.com")).thenReturn(Optional.of(existingUser));
        when(userRepository.findByGoogleSub("shared-sub")).thenReturn(Optional.of(conflictingUser));

        assertThatThrownBy(
                        () ->
                                service.provisionFromGoogleAttributes(
                                        Map.of("email", "one@example.com", "sub", "shared-sub")))
                .isInstanceOf(AuthFlowException.class)
                .hasMessageContaining("already linked");
    }

    @Test
    void blocksInactiveUsersFromSigningIn() {
        User inactiveUser =
                User.builder()
                        .id(14L)
                        .email("inactive@example.com")
                        .googleSub("google-inactive")
                        .status(UserStatus.INACTIVE)
                        .build();

        when(userRepository.findByEmailIgnoreCase("inactive@example.com"))
                .thenReturn(Optional.of(inactiveUser));
        when(userRepository.findByGoogleSub("google-inactive")).thenReturn(Optional.of(inactiveUser));

        assertThatThrownBy(
                        () ->
                                service.provisionFromGoogleAttributes(
                                        Map.of(
                                                "email", "inactive@example.com",
                                                "sub", "google-inactive")))
                .isInstanceOf(AuthFlowException.class)
                .hasMessageContaining("not allowed to sign in");
    }

    @Test
    void rejectsProfilesMissingRequiredGoogleAttributes() {
        assertThatThrownBy(() -> service.provisionFromGoogleAttributes(Map.of("email", "missing@example.com")))
                .isInstanceOf(AuthFlowException.class)
                .hasMessageContaining("Missing required Google attribute");
    }
}
