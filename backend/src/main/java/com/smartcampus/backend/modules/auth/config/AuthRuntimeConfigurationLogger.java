package com.smartcampus.backend.modules.auth.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AuthRuntimeConfigurationLogger implements ApplicationRunner {

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String googleClientId;

    @Override
    public void run(ApplicationArguments args) {
        log.info(
                "Auth runtime configuration: frontendUrl={}, datasourceTarget={}, googleClientConfigured={}",
                frontendUrl,
                sanitizeDatasourceUrl(datasourceUrl),
                googleClientId != null && !googleClientId.isBlank());
    }

    private String sanitizeDatasourceUrl(String url) {
        if (url == null || url.isBlank()) {
            return "<not-configured>";
        }

        int queryIndex = url.indexOf('?');
        return queryIndex >= 0 ? url.substring(0, queryIndex) : url;
    }
}
