package com.smartcampus.backend.common.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

class SupabaseDatabaseEnvironmentPostProcessorTest {

    private final SupabaseDatabaseEnvironmentPostProcessor postProcessor =
            new SupabaseDatabaseEnvironmentPostProcessor();

    @Test
    void resolvesPoolerModeProperties() {
        ConfigurableEnvironment environment =
                environmentWith(
                        Map.of(
                                "DB_CONNECTION_MODE", "pooler",
                                "DB_URL_POOLER",
                                        "jdbc:postgresql://aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require",
                                "DB_USER_POOLER", "postgres.projectref",
                                "DB_PASSWORD", "secret-password"));

        postProcessor.postProcessEnvironment(environment, new SpringApplication(Object.class));

        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo(
                        "jdbc:postgresql://aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require");
        assertThat(environment.getProperty("spring.datasource.username"))
                .isEqualTo("postgres.projectref");
        assertThat(environment.getProperty("spring.datasource.password")).isEqualTo("secret-password");
        assertThat(environment.getProperty("app.database.connection-mode")).isEqualTo("pooler");
        assertThat(environment.getProperty("app.database.datasource-target"))
                .isEqualTo("jdbc:postgresql://aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres");
    }

    @Test
    void resolvesDirectModeProperties() {
        ConfigurableEnvironment environment =
                environmentWith(
                        Map.of(
                                "DB_CONNECTION_MODE", "direct",
                                "DB_URL_DIRECT",
                                        "jdbc:postgresql://db.projectref.supabase.co:5432/postgres?sslmode=require",
                                "DB_USER_DIRECT", "postgres",
                                "DB_PASSWORD", "secret-password"));

        postProcessor.postProcessEnvironment(environment, new SpringApplication(Object.class));

        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo(
                        "jdbc:postgresql://db.projectref.supabase.co:5432/postgres?sslmode=require");
        assertThat(environment.getProperty("app.database.connection-mode")).isEqualTo("direct");
        assertThat(environment.getProperty("app.database.datasource-target"))
                .isEqualTo("jdbc:postgresql://db.projectref.supabase.co:5432/postgres");
    }

    @Test
    void missingSelectedUrlFailsFast() {
        ConfigurableEnvironment environment =
                environmentWith(
                        Map.of(
                                "DB_CONNECTION_MODE", "pooler",
                                "DB_USER_POOLER", "postgres.projectref",
                                "DB_PASSWORD", "secret-password"));

        assertThatThrownBy(
                        () ->
                                postProcessor.postProcessEnvironment(
                                        environment, new SpringApplication(Object.class)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Missing DB_URL_POOLER");
    }

    @Test
    void invalidModeFailsFast() {
        ConfigurableEnvironment environment =
                environmentWith(
                        Map.of(
                                "DB_CONNECTION_MODE", "auto",
                                "DB_USER", "postgres.projectref",
                                "DB_PASSWORD", "secret-password"));

        assertThatThrownBy(
                        () ->
                                postProcessor.postProcessEnvironment(
                                        environment, new SpringApplication(Object.class)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Unsupported DB_CONNECTION_MODE");
    }

    @Test
    void placeholderValuesFailFast() {
        ConfigurableEnvironment environment =
                environmentWith(
                        Map.of(
                                "DB_CONNECTION_MODE", "direct",
                                "DB_URL_DIRECT",
                                        "jdbc:postgresql://db.<your-project-ref>.supabase.co:5432/postgres?sslmode=require",
                                "DB_USER_DIRECT", "postgres",
                                "DB_PASSWORD", "secret-password"));

        assertThatThrownBy(
                        () ->
                                postProcessor.postProcessEnvironment(
                                        environment, new SpringApplication(Object.class)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("placeholder");
    }

    @Test
    void missingPasswordFailsFast() {
        ConfigurableEnvironment environment =
                environmentWith(
                        Map.of(
                                "DB_CONNECTION_MODE", "direct",
                                "DB_URL_DIRECT",
                                        "jdbc:postgresql://db.projectref.supabase.co:5432/postgres?sslmode=require"));

        assertThatThrownBy(
                        () ->
                                postProcessor.postProcessEnvironment(
                                        environment, new SpringApplication(Object.class)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Missing DB_USER_DIRECT");
    }

    @Test
    void fallsBackToSharedUserWhenModeSpecificUserMissing() {
        ConfigurableEnvironment environment =
                environmentWith(
                        Map.of(
                                "DB_CONNECTION_MODE", "direct",
                                "DB_URL_DIRECT",
                                        "jdbc:postgresql://db.projectref.supabase.co:5432/postgres?sslmode=require",
                                "DB_USER", "postgres",
                                "DB_PASSWORD", "secret-password"));

        postProcessor.postProcessEnvironment(environment, new SpringApplication(Object.class));

        assertThat(environment.getProperty("spring.datasource.username")).isEqualTo("postgres");
    }

    @Test
    void stillRequiresPasswordWhenModeSpecificUserExists() {
        ConfigurableEnvironment environment =
                environmentWith(
                        Map.of(
                                "DB_CONNECTION_MODE", "direct",
                                "DB_URL_DIRECT",
                                        "jdbc:postgresql://db.projectref.supabase.co:5432/postgres?sslmode=require",
                                "DB_USER_DIRECT", "postgres"));

        assertThatThrownBy(
                        () ->
                                postProcessor.postProcessEnvironment(
                                        environment, new SpringApplication(Object.class)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Missing DB_PASSWORD");
    }

    private ConfigurableEnvironment environmentWith(Map<String, Object> properties) {
        StandardEnvironment environment = new StandardEnvironment();
        environment.getPropertySources().addFirst(new MapPropertySource("test", properties));
        return environment;
    }
}
