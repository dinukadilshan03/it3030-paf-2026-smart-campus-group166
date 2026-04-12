package com.smartcampus.backend.modules.user.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.modules.user.dto.UserDetailResponse;
import com.smartcampus.backend.modules.user.service.UserService;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.prepost.PreAuthorize;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock private UserService userService;

    @InjectMocks private UserController userController;

    @Test
    void controllerIsRestrictedToAdmins() {
        PreAuthorize annotation = UserController.class.getAnnotation(PreAuthorize.class);

        assertThat(annotation).isNotNull();
        assertThat(annotation.value()).isEqualTo("hasRole('ADMIN')");
    }

    @Test
    void returnsUserDetailFromService() {
        UserDetailResponse expected =
                new UserDetailResponse(
                        1L,
                        "admin@example.com",
                        "Admin",
                        "User",
                        "Admin User",
                        "+94112223344",
                        null,
                        RoleCode.ADMIN,
                        UserStatus.ACTIVE,
                        LocalDateTime.now(),
                        LocalDateTime.now(),
                        LocalDateTime.now());
        when(userService.getUserById(1L)).thenReturn(expected);

        UserDetailResponse response = userController.getUserById(1L);

        assertThat(response.role()).isEqualTo(RoleCode.ADMIN);
        assertThat(response.email()).isEqualTo("admin@example.com");
    }
}
