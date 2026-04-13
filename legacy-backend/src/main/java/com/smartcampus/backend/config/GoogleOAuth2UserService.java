package com.smartcampus.backend.config;

import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.enums.OAuthProvider;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.common.repository.RoleRepository;
import com.smartcampus.backend.common.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GoogleOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = delegate.loadUser(userRequest);
        Map<String, Object> attributes = oauth2User.getAttributes();
        String email = attributes.get("email") != null ? attributes.get("email").toString() : null;
        String sub = attributes.get("sub") != null ? attributes.get("sub").toString() : null;
        String name = attributes.get("name") != null ? attributes.get("name").toString() : email;

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("missing_email"),
                    "Google account did not provide an email address"
            );
        }

        Role defaultRole = roleRepository.findByRoleName("USER")
                .orElseThrow(() -> new ResourceNotFoundException("Default USER role is missing"));

        User user = userRepository.findByEmail(email)
                .map(existing -> {
                    existing.setOauthProvider(OAuthProvider.GOOGLE);
                    existing.setOauthId(sub);
                    if (existing.getStatus() == null) {
                        existing.setStatus(UserStatus.ACTIVE);
                    }
                    return existing;
                })
                .orElseGet(() -> User.builder()
                        .name(name)
                        .email(email)
                        .role(defaultRole)
                        .oauthProvider(OAuthProvider.GOOGLE)
                        .oauthId(sub)
                        .status(UserStatus.ACTIVE)
                        .build());

        User savedUser = userRepository.save(user);
        String roleName = savedUser.getRole() == null ? "USER" : savedUser.getRole().getRoleName();

        return new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_" + roleName)),
                attributes,
                "email"
        );
    }
}
