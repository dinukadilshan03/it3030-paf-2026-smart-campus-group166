package com.smartcampus.backend.modules.auth.config;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.ServletException;
import java.io.IOException;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class OAuth2LoginFailureHandlerTest {

    private final OAuth2LoginFailureHandler failureHandler =
            new OAuth2LoginFailureHandler("http://localhost:3000");

    @Test
    void redirectsBlockedAccountsWithStableErrorCode() throws ServletException, IOException {
        MockHttpServletResponse response = new MockHttpServletResponse();

        failureHandler.onAuthenticationFailure(
                new MockHttpServletRequest(),
                response,
                new OAuth2AuthenticationException(new OAuth2Error("account_blocked")));

        assertThat(response.getRedirectedUrl())
                .isEqualTo("http://localhost:3000/login?error=account_blocked");
    }

    @Test
    void fallsBackToGenericOauthFailureCode() throws ServletException, IOException {
        MockHttpServletResponse response = new MockHttpServletResponse();

        failureHandler.onAuthenticationFailure(
                new MockHttpServletRequest(),
                response,
                new OAuth2AuthenticationException(new OAuth2Error("something_else")));

        assertThat(response.getRedirectedUrl())
                .isEqualTo("http://localhost:3000/login?error=oauth_failed");
    }
}
