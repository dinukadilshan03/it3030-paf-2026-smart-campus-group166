package com.smartcampus.backend.common.dto;

public record HealthResponse(
        String status,
        String database,
        boolean supabaseConfigured) {}
