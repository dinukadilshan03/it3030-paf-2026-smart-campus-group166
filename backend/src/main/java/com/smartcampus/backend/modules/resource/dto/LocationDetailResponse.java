package com.smartcampus.backend.modules.resource.dto;

public record LocationDetailResponse(
        Long id,
        String code,
        String name,
        String building,
        String floor,
        String roomIdentifier,
        String description) {}
