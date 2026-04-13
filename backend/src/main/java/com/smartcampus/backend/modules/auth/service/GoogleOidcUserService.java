package com.smartcampus.backend.modules.auth.service;

import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.modules.auth.exception.AuthFlowException;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleOidcUserService extends OidcUserService {

    private final OAuthUserProvisioningService provisioningService;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);
        Map<String, Object> attributes = oidcUser.getAttributes();
        log.info(
                "Google OIDC profile received for email={} sub={}",
                attributes.get("email"),
                attributes.get("sub"));

        UserRole activeRole;
        try {
            activeRole = provisioningService.provisionFromGoogleAttributes(attributes);
        } catch (AuthFlowException ex) {
            log.warn(
                    "Google OIDC provisioning failed for email={} failureCode={} message={}",
                    attributes.get("email"),
                    ex.getFailureCode().getQueryValue(),
                    ex.getMessage());
            throw new OAuth2AuthenticationException(
                    new OAuth2Error(ex.getFailureCode().getQueryValue()), ex.getMessage(), ex);
        }

        return new DefaultOidcUser(
                List.of(new SimpleGrantedAuthority("ROLE_" + activeRole.getRole().getCode().name())),
                oidcUser.getIdToken(),
                oidcUser.getUserInfo(),
                "email");
    }
}
