package com.smartcampus.backend.common.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.common.dto.HealthResponse;
import java.sql.Connection;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class HealthServiceTest {

    @Mock private DataSource dataSource;
    @Mock private Connection connection;

    private HealthService healthService;

    @BeforeEach
    void setUp() {
        healthService = new HealthService(dataSource);
    }

    @Test
    void returnsUpWhenDatabaseIsReachable() throws Exception {
        ReflectionTestUtils.setField(healthService, "supabaseUrl", "https://example.supabase.co");
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.isValid(2)).thenReturn(true);

        HealthResponse response = healthService.getHealth();

        assertThat(response.status()).isEqualTo("UP");
        assertThat(response.database()).isEqualTo("UP");
        assertThat(response.supabaseConfigured()).isTrue();
    }

    @Test
    void returnsDegradedWhenDatabaseIsNotReachable() throws Exception {
        ReflectionTestUtils.setField(healthService, "supabaseUrl", "");
        when(dataSource.getConnection()).thenThrow(new java.sql.SQLException("db down"));

        HealthResponse response = healthService.getHealth();

        assertThat(response.status()).isEqualTo("DEGRADED");
        assertThat(response.database()).isEqualTo("DOWN");
        assertThat(response.supabaseConfigured()).isFalse();
    }
}
