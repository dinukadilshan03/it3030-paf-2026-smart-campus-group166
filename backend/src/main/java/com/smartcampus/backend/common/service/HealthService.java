package com.smartcampus.backend.common.service;

import com.smartcampus.backend.common.dto.HealthResponse;
import java.sql.Connection;
import java.sql.SQLException;
import javax.sql.DataSource;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HealthService {

    private final DataSource dataSource;

    @Value("${app.supabase.url:}")
    private String supabaseUrl;

    public HealthResponse getHealth() {
        boolean supabaseConfigured =
                supabaseUrl != null
                        && !supabaseUrl.isBlank()
                        && !supabaseUrl.contains("<")
                        && supabaseUrl.startsWith("http");
        String databaseStatus = canConnect() ? "UP" : "DOWN";
        String overallStatus = "UP".equals(databaseStatus) ? "UP" : "DEGRADED";

        return new HealthResponse(overallStatus, databaseStatus, supabaseConfigured);
    }

    private boolean canConnect() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(2);
        } catch (SQLException ex) {
            return false;
        }
    }
}
