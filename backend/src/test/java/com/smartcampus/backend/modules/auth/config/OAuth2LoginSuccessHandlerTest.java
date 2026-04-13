package com.smartcampus.backend.modules.auth.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.modules.auth.exception.AuthFailureCode;
import com.smartcampus.backend.modules.auth.service.AuthProvisioningVerifier;
import com.smartcampus.backend.modules.auth.service.AuthenticatedEmailResolver;
import jakarta.servlet.ServletException;
import java.io.IOException;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.TestingAuthenticationToken;

@ExtendWith(MockitoExtension.class)
class OAuth2LoginSuccessHandlerTest {

    @Mock private AuthenticatedEmailResolver authenticatedEmailResolver;
    @Mock private AuthProvisioningVerifier authProvisioningVerifier;

    @Test
    void redirectsToCallbackWhenProvisioningVerificationPasses()
            throws ServletException, IOException {
        OAuth2LoginSuccessHandler successHandler =
                new OAuth2LoginSuccessHandler(
                        "http://localhost:3000",
                        authenticatedEmailResolver,
                        authProvisioningVerifier);
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        TestingAuthenticationToken authentication =
                new TestingAuthenticationToken("student@example.com", "n/a", "ROLE_STUDENT");
        authentication.setAuthenticated(true);

        when(authenticatedEmailResolver.resolveAuthenticatedEmail(authentication))
                .thenReturn("student@example.com");
        when(authProvisioningVerifier.verifyActiveProvisionedMembership("student@example.com"))
                .thenReturn(Optional.empty());

        successHandler.onAuthenticationSuccess(request, response, authentication);

        assertThat(response.getRedirectedUrl()).isEqualTo("http://localhost:3000/auth/callback");
    }

    @Test
    void redirectsToLoginWhenProvisioningVerificationFails() throws ServletException, IOException {
        OAuth2LoginSuccessHandler successHandler =
                new OAuth2LoginSuccessHandler(
                        "http://localhost:3000",
                        authenticatedEmailResolver,
                        authProvisioningVerifier);
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        TestingAuthenticationToken authentication =
                new TestingAuthenticationToken("student@example.com", "n/a", "ROLE_STUDENT");
        authentication.setAuthenticated(true);

        when(authenticatedEmailResolver.resolveAuthenticatedEmail(authentication))
                .thenReturn("student@example.com");
        when(authProvisioningVerifier.verifyActiveProvisionedMembership("student@example.com"))
                .thenReturn(Optional.of(AuthFailureCode.PROVISIONING_FAILED));

        successHandler.onAuthenticationSuccess(request, response, authentication);

        assertThat(response.getRedirectedUrl())
                .isEqualTo("http://localhost:3000/login?error=provisioning_failed");
    }
}
