package com.smartcampus.backend.common.controller;

import com.smartcampus.backend.common.dto.HealthResponse;
import com.smartcampus.backend.common.service.HealthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
@RequiredArgsConstructor
public class HealthController {

    private final HealthService healthService;

    @GetMapping
    public HealthResponse health() {
        return healthService.getHealth();
    }
}
