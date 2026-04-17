package com.smartcampus.backend.common.config;

import java.net.SocketTimeoutException;
import org.flywaydb.core.internal.exception.FlywaySqlException;
import org.springframework.boot.diagnostics.AbstractFailureAnalyzer;
import org.springframework.boot.diagnostics.FailureAnalysis;

public class SupabaseDatabaseConnectionFailureAnalyzer
        extends AbstractFailureAnalyzer<Throwable> {

    @Override
    protected FailureAnalysis analyze(Throwable rootFailure, Throwable cause) {
        if (!hasRelevantCause(cause)) {
            return null;
        }

        return new FailureAnalysis(
                "The backend could not connect to the configured Supabase Postgres endpoint. "
                        + "This usually means the selected connection mode is wrong for the current network, "
                        + "or the network cannot reach the Supabase host on port 5432.",
                "Verify DB_CONNECTION_MODE and the matching DB_URL_POOLER or DB_URL_DIRECT value. "
                        + "If pooler mode times out, switch to direct mode. "
                        + "If direct mode fails, switch back to pooler mode. "
                        + "On Windows, test connectivity with 'Test-NetConnection <supabase-host> -Port 5432'.",
                rootFailure);
    }

    private boolean hasRelevantCause(Throwable cause) {
        Throwable current = cause;
        while (current != null) {
            if (current instanceof SocketTimeoutException) {
                return true;
            }
            if ("org.postgresql.util.PSQLException".equals(current.getClass().getName())
                    && current.getMessage() != null
                    && current.getMessage().toLowerCase().contains("connection attempt failed")) {
                return true;
            }
            if (current instanceof FlywaySqlException
                    && current.getMessage() != null
                    && current.getMessage().toLowerCase().contains("unable to obtain connection")) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }
}
