package com.smartcampus.backend.modules.auth.config;

import com.smartcampus.backend.modules.auth.exception.AuthFailureCode;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Slf4j
@Component
public class OAuth2LoginFailureHandler implements AuthenticationFailureHandler {

    private final String frontendBaseUrl;

    public OAuth2LoginFailureHandler(
            @Value("${app.frontend-url:http://localhost:3000}") String frontendBaseUrl) {
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception)
            throws IOException, ServletException {
        AuthFailureCode failureCode = resolveFailureCode(exception);
        log.warn(
                "Google auth failed with code={} message={}",
                failureCode.getQueryValue(),
                exception.getMessage());

        response.sendRedirect(
                UriComponentsBuilder.fromUriString(frontendBaseUrl)
                        .path("/login")
                        .queryParam("error", failureCode.getQueryValue())
                        .build()
                        .toUriString());
    }

    private AuthFailureCode resolveFailureCode(AuthenticationException exception) {
        if (exception instanceof OAuth2AuthenticationException oauth2Exception) {
            return AuthFailureCode.fromQueryValue(oauth2Exception.getError().getErrorCode())
                    .orElse(AuthFailureCode.OAUTH_FAILED);
        }
        return AuthFailureCode.OAUTH_FAILED;
    }
}
