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

    @Value("${app.database.connection-mode:unknown}")
    private String connectionMode;

    @Value("${app.database.datasource-target:<not-configured>}")
    private String datasourceTarget;

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String googleClientId;

    @Override
    public void run(ApplicationArguments args) {
        log.info(
                "Auth runtime configuration: frontendUrl={}, datasourceMode={}, datasourceTarget={}, googleClientConfigured={}",
                frontendUrl,
                connectionMode,
                resolveDatasourceTarget(),
                googleClientId != null && !googleClientId.isBlank());
    }

    private String resolveDatasourceTarget() {
        if (datasourceTarget != null && !datasourceTarget.isBlank()) {
            return datasourceTarget;
        }
        return sanitizeDatasourceUrl(datasourceUrl);
    }

    private String sanitizeDatasourceUrl(String url) {
        if (url == null || url.isBlank()) {
            return "<not-configured>";
        }

        int queryIndex = url.indexOf('?');
        return queryIndex >= 0 ? url.substring(0, queryIndex) : url;
    }
}
