package com.smartcampus.backend.modules.auth.service;

import com.smartcampus.backend.common.dto.UserResponseDTO;
import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.enums.OAuthProvider;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.common.mapper.UserMapper;
import com.smartcampus.backend.common.repository.RoleRepository;
import com.smartcampus.backend.common.repository.UserRepository;
import com.smartcampus.backend.modules.auth.dto.CurrentUserResponseDTO;
import com.smartcampus.backend.modules.auth.dto.LoginRequestDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public CurrentUserResponseDTO login(LoginRequestDTO request, HttpServletRequest httpRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        httpRequest.getSession(true).setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                context
        );

        return buildCurrentUserResponse(authentication.getName());
    }

    public CurrentUserResponseDTO getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return CurrentUserResponseDTO.builder()
                    .authenticated(false)
                    .user(null)
                    .build();
        }

        try {
            return buildCurrentUserResponse(resolveAuthenticatedEmail(authentication));
        } catch (UsernameNotFoundException ex) {
            return CurrentUserResponseDTO.builder()
                    .authenticated(false)
                    .user(null)
                    .build();
        }
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    private CurrentUserResponseDTO buildCurrentUserResponse(String email) {
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> provisionOAuthUserIfPossible(email));
        UserResponseDTO response = UserMapper.toDTO(user);
        return CurrentUserResponseDTO.builder()
                .authenticated(true)
                .user(response)
                .build();
    }

    private String resolveAuthenticatedEmail(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        if (principal instanceof OidcUser oidcUser) {
            String email = oidcUser.getEmail();
            if (email != null && !email.isBlank()) {
                return email;
            }
        }

        if (principal instanceof OAuth2User oauth2User) {
            String email = oauth2User.getAttribute("email");
            if (email != null && !email.isBlank()) {
                return email;
            }
        }

        return authentication.getName();
    }

    private User provisionOAuthUserIfPossible(String email) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication != null ? authentication.getPrincipal() : null;

        if (!(principal instanceof OAuth2User oauth2User)) {
            throw new UsernameNotFoundException("Authenticated user no longer exists");
        }

        String name = oauth2User.getAttribute("name");
        String subject = oauth2User.getAttribute("sub");

        Role defaultRole = roleRepository.findByRoleName("USER")
                .orElseThrow(() -> new ResourceNotFoundException("Default USER role is missing"));

        return userRepository.save(User.builder()
                .name(name != null && !name.isBlank() ? name : email)
                .email(email)
                .role(defaultRole)
                .oauthProvider(OAuthProvider.GOOGLE)
                .oauthId(subject)
                .status(UserStatus.ACTIVE)
                .build());
    }
}
