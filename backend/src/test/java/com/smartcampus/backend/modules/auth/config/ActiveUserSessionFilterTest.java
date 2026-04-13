package com.smartcampus.backend.modules.auth.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.modules.auth.service.AuthenticatedEmailResolver;
import com.smartcampus.backend.modules.user.repository.UserRepository;
import java.io.IOException;
import java.util.Optional;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class ActiveUserSessionFilterTest {

    @Mock private UserRepository userRepository;
    @Mock private AuthenticatedEmailResolver authenticatedEmailResolver;

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void allowsActiveAuthenticatedUsers() throws ServletException, IOException {
        ActiveUserSessionFilter filter =
                new ActiveUserSessionFilter(userRepository, authenticatedEmailResolver, new ObjectMapper());
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/resources");
        request.setServletPath("/api/v1/resources");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();
        TestingAuthenticationToken authentication =
                new TestingAuthenticationToken("active@example.com", "n/a", "ROLE_ADMIN");
        authentication.setAuthenticated(true);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        when(authenticatedEmailResolver.isAuthenticated(authentication)).thenReturn(true);
        when(authenticatedEmailResolver.resolveAuthenticatedEmail(authentication))
                .thenReturn("active@example.com");
        when(userRepository.findByEmailIgnoreCase("active@example.com"))
                .thenReturn(
                        Optional.of(
                                User.builder()
                                        .id(1L)
                                        .email("active@example.com")
                                        .status(UserStatus.ACTIVE)
                                        .build()));

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(200);
        verify(userRepository).findByEmailIgnoreCase("active@example.com");
    }

    @Test
    void clearsSessionWhenUserIsNoLongerActive() throws ServletException, IOException {
        ActiveUserSessionFilter filter =
                new ActiveUserSessionFilter(userRepository, authenticatedEmailResolver, new ObjectMapper());
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/resources");
        request.setServletPath("/api/v1/resources");
        MockHttpServletResponse response = new MockHttpServletResponse();
        TestingAuthenticationToken authentication =
                new TestingAuthenticationToken("blocked@example.com", "n/a", "ROLE_STUDENT");
        authentication.setAuthenticated(true);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        when(authenticatedEmailResolver.isAuthenticated(authentication)).thenReturn(true);
        when(authenticatedEmailResolver.resolveAuthenticatedEmail(authentication))
                .thenReturn("blocked@example.com");
        when(userRepository.findByEmailIgnoreCase("blocked@example.com"))
                .thenReturn(
                        Optional.of(
                                User.builder()
                                        .id(2L)
                                        .email("blocked@example.com")
                                        .status(UserStatus.SUSPENDED)
                                        .build()));

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentAsString()).contains("account_blocked");
        assertThat(response.getContentAsString()).contains("Account is no longer active");
    }

    @Test
    void returnsProvisioningFailureWhenSessionHasNoLocalUser() throws ServletException, IOException {
        ActiveUserSessionFilter filter =
                new ActiveUserSessionFilter(userRepository, authenticatedEmailResolver, new ObjectMapper());
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/auth/me");
        request.setServletPath("/api/v1/auth/me");
        MockHttpServletResponse response = new MockHttpServletResponse();
        TestingAuthenticationToken authentication =
                new TestingAuthenticationToken("missing@example.com", "n/a", "ROLE_STUDENT");
        authentication.setAuthenticated(true);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        when(authenticatedEmailResolver.isAuthenticated(authentication)).thenReturn(true);
        when(authenticatedEmailResolver.resolveAuthenticatedEmail(authentication))
                .thenReturn("missing@example.com");
        when(userRepository.findByEmailIgnoreCase("missing@example.com")).thenReturn(Optional.empty());

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentAsString()).contains("provisioning_failed");
        assertThat(response.getContentAsString()).contains("could not be linked");
    }

    @Test
    void skipsAnonymousRequests() throws ServletException, IOException {
        ActiveUserSessionFilter filter =
                new ActiveUserSessionFilter(userRepository, authenticatedEmailResolver, new ObjectMapper());
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/health");
        request.setServletPath("/api/v1/health");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(authenticatedEmailResolver.isAuthenticated(null)).thenReturn(false);

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(200);
        verifyNoInteractions(userRepository);
    }
}
