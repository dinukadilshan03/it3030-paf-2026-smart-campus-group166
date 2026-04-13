package com.smartcampus.backend.modules.auth.config;

import com.smartcampus.backend.modules.auth.exception.AuthFailureCode;
import com.smartcampus.backend.modules.auth.service.AuthProvisioningVerifier;
import com.smartcampus.backend.modules.auth.service.AuthenticatedEmailResolver;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Slf4j
@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final String frontendBaseUrl;
    private final AuthenticatedEmailResolver authenticatedEmailResolver;
    private final AuthProvisioningVerifier authProvisioningVerifier;
    private final HttpSessionSecurityContextRepository securityContextRepository =
            new HttpSessionSecurityContextRepository();

    public OAuth2LoginSuccessHandler(
            @Value("${app.frontend-url:http://localhost:3000}") String frontendBaseUrl,
            AuthenticatedEmailResolver authenticatedEmailResolver,
            AuthProvisioningVerifier authProvisioningVerifier) {
        this.frontendBaseUrl = frontendBaseUrl;
        this.authenticatedEmailResolver = authenticatedEmailResolver;
        this.authProvisioningVerifier = authProvisioningVerifier;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication)
            throws IOException, ServletException {
        String email = authenticatedEmailResolver.resolveAuthenticatedEmail(authentication);
        log.info("Google auth success received for email={}", email);

        var authFailure = authProvisioningVerifier.verifyActiveProvisionedMembership(email);
        if (authFailure.isPresent()) {
            SecurityContextHolder.clearContext();
            request.getSession(false);
            log.warn(
                    "Google auth success could not complete local provisioning for email={} failureCode={}",
                    email,
                    authFailure.get().getQueryValue());
            response.sendRedirect(buildLoginRedirect(authFailure.get()));
            return;
        }

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        request.getSession(true);
        securityContextRepository.saveContext(context, request, response);

        log.info("Google auth session established for email={}", email);
        response.sendRedirect(frontendBaseUrl + "/auth/callback");
    }

    private String buildLoginRedirect(AuthFailureCode failureCode) {
        return UriComponentsBuilder.fromUriString(frontendBaseUrl)
                .path("/login")
                .queryParam("error", failureCode.getQueryValue())
                .build()
                .toUriString();
    }
}
