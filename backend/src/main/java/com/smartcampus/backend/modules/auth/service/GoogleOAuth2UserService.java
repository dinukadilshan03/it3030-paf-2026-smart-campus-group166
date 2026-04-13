package com.smartcampus.backend.modules.auth.service;

import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.modules.auth.exception.AuthFlowException;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final OAuthUserProvisioningService provisioningService;
    private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = delegate.loadUser(userRequest);
        Map<String, Object> attributes = oauth2User.getAttributes();
        log.info(
                "Google profile received for email={} sub={}",
                attributes.get("email"),
                attributes.get("sub"));
        UserRole activeRole;
        try {
            activeRole = provisioningService.provisionFromGoogleAttributes(attributes);
        } catch (AuthFlowException ex) {
            log.warn(
                    "Google profile provisioning failed for email={} failureCode={} message={}",
                    attributes.get("email"),
                    ex.getFailureCode().getQueryValue(),
                    ex.getMessage());
            throw new OAuth2AuthenticationException(
                    new OAuth2Error(ex.getFailureCode().getQueryValue()), ex.getMessage(), ex);
        }

        return new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_" + activeRole.getRole().getCode().name())),
                attributes,
                "email");
    }
}
