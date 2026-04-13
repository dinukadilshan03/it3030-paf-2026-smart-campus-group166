package com.smartcampus.backend.modules.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.modules.auth.dto.CurrentUserResponse;
import com.smartcampus.backend.modules.auth.service.AuthService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock private AuthService authService;

    @InjectMocks private AuthController authController;

    @Test
    void returnsAnonymousCurrentUserResponse() {
        CurrentUserResponse anonymous =
                new CurrentUserResponse(false, null, null, null, null, null, false);
        when(authService.getCurrentUser()).thenReturn(anonymous);

        CurrentUserResponse response = authController.getCurrentUser();

        assertThat(response.authenticated()).isFalse();
    }
}
