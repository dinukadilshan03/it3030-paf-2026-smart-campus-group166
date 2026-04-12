package com.smartcampus.backend.modules.resource.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ReplaceResourceAvailabilityRequest(
        @NotNull(message = "Availability windows are required")
                List<@Valid ResourceAvailabilityWindowRequest> windows) {}
