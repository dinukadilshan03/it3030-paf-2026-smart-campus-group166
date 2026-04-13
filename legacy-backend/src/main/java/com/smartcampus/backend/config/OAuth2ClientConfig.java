package com.smartcampus.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.InMemoryOAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Configuration
public class OAuth2ClientConfig {

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository(
            @Value("${GOOGLE_CLIENT_ID:}") String googleClientId,
            @Value("${GOOGLE_CLIENT_SECRET:}") String googleClientSecret
    ) {
        List<ClientRegistration> registrations = new ArrayList<>();

        if (!googleClientId.isBlank() && !googleClientSecret.isBlank()) {
            registrations.add(
                    CommonOAuth2Provider.GOOGLE.getBuilder("google")
                            .clientId(googleClientId)
                            .clientSecret(googleClientSecret)
                            .scope("openid", "profile", "email")
                            .build()
            );
        }

        return new OptionalClientRegistrationRepository(registrations);
    }

    @Bean
    public OAuth2AuthorizedClientService authorizedClientService(
            ClientRegistrationRepository clientRegistrationRepository
    ) {
        return new InMemoryOAuth2AuthorizedClientService(clientRegistrationRepository);
    }

    private static final class OptionalClientRegistrationRepository
            implements ClientRegistrationRepository, Iterable<ClientRegistration> {

        private final List<ClientRegistration> registrations;

        private OptionalClientRegistrationRepository(List<ClientRegistration> registrations) {
            this.registrations = List.copyOf(registrations);
        }

        @Override
        public ClientRegistration findByRegistrationId(String registrationId) {
            return registrations.stream()
                    .filter(registration -> registration.getRegistrationId().equals(registrationId))
                    .findFirst()
                    .orElse(null);
        }

        @Override
        public Iterator<ClientRegistration> iterator() {
            return registrations.iterator();
        }
    }
}
