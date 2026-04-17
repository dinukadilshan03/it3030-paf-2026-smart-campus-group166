package com.smartcampus.backend.common.config;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

public class SupabaseDatabaseEnvironmentPostProcessor
        implements EnvironmentPostProcessor, Ordered {

    private static final Logger log =
            LoggerFactory.getLogger(SupabaseDatabaseEnvironmentPostProcessor.class);

    private static final String DATASOURCE_URL = "spring.datasource.url";
    private static final String DATASOURCE_USERNAME = "spring.datasource.username";
    private static final String DATASOURCE_PASSWORD = "spring.datasource.password";
    private static final String CONNECTION_MODE = "DB_CONNECTION_MODE";
    private static final String DIRECT_URL = "DB_URL_DIRECT";
    private static final String POOLER_URL = "DB_URL_POOLER";
    private static final String DIRECT_USER = "DB_USER_DIRECT";
    private static final String POOLER_USER = "DB_USER_POOLER";
    private static final String SHARED_USER = "DB_USER";
    private static final String SHARED_PASSWORD = "DB_PASSWORD";
    private static final String DATABASE_MODE_PROPERTY = "app.database.connection-mode";
    private static final String DATABASE_TARGET_PROPERTY = "app.database.datasource-target";
    private static final String PROPERTY_SOURCE_NAME = "supabaseDatabaseConfiguration";

    @Override
    public void postProcessEnvironment(
            ConfigurableEnvironment environment, SpringApplication application) {
        String explicitDatasourceUrl = trim(environment.getProperty(DATASOURCE_URL));
        String username = trim(environment.getProperty(SHARED_USER, environment.getProperty(DATASOURCE_USERNAME)));
        String password =
                trim(environment.getProperty(SHARED_PASSWORD, environment.getProperty(DATASOURCE_PASSWORD)));

        if (!explicitDatasourceUrl.isBlank()) {
            validateUrl(DATASOURCE_URL, explicitDatasourceUrl);
            validateCredentials(DATASOURCE_USERNAME, username, password);
            publishResolvedProperties(environment, "manual", explicitDatasourceUrl, username, password);
            return;
        }

        ConnectionMode mode = resolveConnectionMode(environment.getProperty(CONNECTION_MODE));
        String urlPropertyName = mode == ConnectionMode.POOLER ? POOLER_URL : DIRECT_URL;
        String userPropertyName = mode == ConnectionMode.POOLER ? POOLER_USER : DIRECT_USER;
        String url = trim(environment.getProperty(urlPropertyName));
        String resolvedUsername =
                trim(environment.getProperty(userPropertyName, environment.getProperty(SHARED_USER)));

        if (url.isBlank()) {
            throw invalidConfiguration(
                    "Missing "
                            + urlPropertyName
                            + " for DB_CONNECTION_MODE="
                            + mode.value
                            + ". Copy the matching JDBC URL from Supabase Connect.");
        }

        validateUrl(urlPropertyName, url);
        validateCredentials(userPropertyName, resolvedUsername, password);
        publishResolvedProperties(environment, mode.value, url, resolvedUsername, password);
    }

    private void publishResolvedProperties(
            ConfigurableEnvironment environment,
            String connectionMode,
            String url,
            String username,
            String password) {
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put(DATASOURCE_URL, url);
        properties.put(DATASOURCE_USERNAME, username);
        properties.put(DATASOURCE_PASSWORD, password);
        properties.put(DATABASE_MODE_PROPERTY, connectionMode);
        properties.put(DATABASE_TARGET_PROPERTY, sanitizeDatasourceUrl(url));

        environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));
        log.info(
                "Configured Supabase datasource using mode={} target={}",
                connectionMode,
                sanitizeDatasourceUrl(url));
    }

    private ConnectionMode resolveConnectionMode(String rawMode) {
        String normalizedMode = trim(rawMode).toLowerCase(Locale.ROOT);
        return switch (normalizedMode) {
            case "pooler" -> ConnectionMode.POOLER;
            case "direct" -> ConnectionMode.DIRECT;
            case "" ->
                    throw invalidConfiguration(
                            "Missing DB_CONNECTION_MODE. Set it to 'pooler' or 'direct' and provide the matching Supabase JDBC URL.");
            default ->
                    throw invalidConfiguration(
                            "Unsupported DB_CONNECTION_MODE='"
                                    + rawMode
                                    + "'. Supported values are 'pooler' and 'direct'.");
        };
    }

    private void validateCredentials(String usernamePropertyName, String username, String password) {
        if (username.isBlank()) {
            throw invalidConfiguration(
                    "Missing "
                            + usernamePropertyName
                            + " (or DB_USER). Set it to the database username from Supabase Connect.");
        }

        if (password.isBlank()) {
            throw invalidConfiguration(
                    "Missing " + SHARED_PASSWORD + ". Set it to the database password from Supabase Connect.");
        }

        if (looksLikePlaceholder(username)) {
            throw invalidConfiguration(
                    usernamePropertyName
                            + " still looks like a placeholder. Replace it with the real value from Supabase Connect.");
        }

        if (looksLikePlaceholder(password)) {
            throw invalidConfiguration(
                    SHARED_PASSWORD
                            + " still looks like a placeholder. Replace it with the real value from Supabase Connect.");
        }
    }

    private void validateUrl(String propertyName, String url) {
        if (!url.startsWith("jdbc:postgresql://")) {
            throw invalidConfiguration(
                    propertyName
                            + " must start with 'jdbc:postgresql://'. Copy the JDBC URL from Supabase Connect.");
        }

        if (looksLikePlaceholder(url)) {
            throw invalidConfiguration(
                    propertyName
                            + " still looks like a placeholder. Replace it with the real Supabase JDBC URL.");
        }
    }

    private boolean looksLikePlaceholder(String value) {
        String normalized = trim(value).toLowerCase(Locale.ROOT);
        return normalized.contains("<")
                || normalized.contains(">")
                || normalized.startsWith("your-")
                || normalized.contains("your-project-ref")
                || normalized.contains("your-supabase");
    }

    private String sanitizeDatasourceUrl(String url) {
        int queryIndex = url.indexOf('?');
        return queryIndex >= 0 ? url.substring(0, queryIndex) : url;
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private IllegalStateException invalidConfiguration(String message) {
        return new IllegalStateException("Supabase database configuration error: " + message);
    }

    @Override
    public int getOrder() {
        return ConfigDataEnvironmentPostProcessor.ORDER + 1;
    }

    private enum ConnectionMode {
        POOLER("pooler"),
        DIRECT("direct");

        private final String value;

        ConnectionMode(String value) {
            this.value = value;
        }
    }
}
