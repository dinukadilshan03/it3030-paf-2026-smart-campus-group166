package com.smartcampus.backend.modules.profile.controller;

import com.smartcampus.backend.modules.profile.dto.ProfileResponse;
import com.smartcampus.backend.modules.profile.dto.UpdateProfileRequest;
import com.smartcampus.backend.modules.profile.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ProfileResponse getCurrentProfile() {
        return profileService.getCurrentProfile();
    }

    @PatchMapping
    public ProfileResponse updateCurrentProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return profileService.updateCurrentProfile(request);
    }
}
