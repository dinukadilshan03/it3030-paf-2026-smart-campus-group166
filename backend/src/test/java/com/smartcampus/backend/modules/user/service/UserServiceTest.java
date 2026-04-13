package com.smartcampus.backend.modules.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.modules.auth.repository.LocalAuthCredentialRepository;
import com.smartcampus.backend.modules.user.dto.UpdateUserRequest;
import com.smartcampus.backend.modules.user.dto.UserSummaryResponse;
import com.smartcampus.backend.modules.user.mapper.UserMapper;
import com.smartcampus.backend.modules.user.repository.RoleRepository;
import com.smartcampus.backend.modules.user.repository.UserRepository;
import com.smartcampus.backend.modules.user.repository.UserRoleRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private UserRoleRepository userRoleRepository;
    @Mock private LocalAuthCredentialRepository localAuthCredentialRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService =
                new UserService(
                        userRepository,
                        roleRepository,
                        userRoleRepository,
                        localAuthCredentialRepository,
                        passwordEncoder,
                        new UserMapper());
    }

    @Test
    void returnsFilteredUsersWithEffectiveRoles() {
        User admin =
                User.builder()
                        .id(1L)
                        .email("admin@example.com")
                        .displayName("Admin User")
                        .status(UserStatus.ACTIVE)
                        .lastLoginAt(LocalDateTime.now())
                        .build();
        Role adminRole = Role.builder().id(1L).code(RoleCode.ADMIN).name("Admin").build();
        UserRole membership = UserRole.builder().user(admin).role(adminRole).isActive(true).build();

        when(userRepository.searchUsers("ADMIN", "ACTIVE", "admin")).thenReturn(List.of(admin));
        when(userRoleRepository.findActiveByUserIds(List.of(1L))).thenReturn(List.of(membership));

        List<UserSummaryResponse> result = userService.getUsers(RoleCode.ADMIN, UserStatus.ACTIVE, "admin");

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().role()).isEqualTo(RoleCode.ADMIN);
    }

    @Test
    void reassignsRoleByEndingPreviousMembershipAndCreatingNewOne() {
        User user = User.builder().id(2L).email("staff@example.com").status(UserStatus.ACTIVE).build();
        Role studentRole = Role.builder().id(1L).code(RoleCode.STUDENT).name("Student").build();
        Role adminRole = Role.builder().id(2L).code(RoleCode.ADMIN).name("Admin").build();
        UserRole currentMembership =
                UserRole.builder().id(30L).user(user).role(studentRole).isActive(true).build();
        UserRole updatedMembership =
                UserRole.builder().id(31L).user(user).role(adminRole).isActive(true).build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(userRoleRepository.findActiveByUserId(2L))
                .thenReturn(Optional.of(currentMembership))
                .thenReturn(Optional.of(updatedMembership));
        when(roleRepository.findByCode(RoleCode.ADMIN)).thenReturn(Optional.of(adminRole));
        when(userRoleRepository.save(any(UserRole.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = userService.updateUserRole(2L, RoleCode.ADMIN);

        assertThat(result.role()).isEqualTo(RoleCode.ADMIN);
        assertThat(currentMembership.getIsActive()).isFalse();
        assertThat(currentMembership.getEndedAt()).isNotNull();
        verify(userRoleRepository, times(2)).save(any(UserRole.class));
    }

    @Test
    void rejectsSuspendingLastActiveAdmin() {
        User admin = User.builder().id(3L).email("admin@example.com").status(UserStatus.ACTIVE).build();
        Role adminRole = Role.builder().id(2L).code(RoleCode.ADMIN).name("Admin").build();
        UserRole membership = UserRole.builder().id(32L).user(admin).role(adminRole).isActive(true).build();

        when(userRepository.findById(3L)).thenReturn(Optional.of(admin));
        when(userRoleRepository.findActiveByUserId(3L)).thenReturn(Optional.of(membership));
        when(userRoleRepository.countActiveUsersByRoleAndStatus(RoleCode.ADMIN, UserStatus.ACTIVE))
                .thenReturn(1L);

        assertThatThrownBy(() -> userService.updateUserStatus(3L, UserStatus.SUSPENDED))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("At least one active admin");
    }

    @Test
    void updatesOnlyAllowedProfileFields() {
        User user =
                User.builder()
                        .id(4L)
                        .email("user@example.com")
                        .firstName("Old")
                        .lastName("Name")
                        .displayName("Old Name")
                        .status(UserStatus.ACTIVE)
                        .build();
        Role studentRole = Role.builder().id(1L).code(RoleCode.STUDENT).name("Student").build();
        UserRole membership = UserRole.builder().id(33L).user(user).role(studentRole).isActive(true).build();

        when(userRepository.findById(4L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        when(userRoleRepository.findActiveByUserId(4L)).thenReturn(Optional.of(membership));

        var result =
                userService.updateUser(
                        4L,
                        new UpdateUserRequest(
                                "New", "Surname", "New Display", "+94112223344", "https://example.com/me.png"));

        assertThat(result.firstName()).isEqualTo("New");
        assertThat(result.displayName()).isEqualTo("New Display");
        assertThat(user.getPhone()).isEqualTo("+94112223344");
    }
}
