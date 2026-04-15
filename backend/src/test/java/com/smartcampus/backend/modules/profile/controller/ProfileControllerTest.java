package com.smartcampus.backend.modules.profile.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserLoginMethod;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.modules.profile.dto.ProfileResponse;
import com.smartcampus.backend.modules.profile.dto.UpdateProfileRequest;
import com.smartcampus.backend.modules.profile.service.ProfileService;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProfileControllerTest {

    @Mock private ProfileService profileService;

    @InjectMocks private ProfileController profileController;

    @Test
    void returnsCurrentProfile() {
        ProfileResponse profile =
                new ProfileResponse(
                        1L,
                        "student@example.com",
                        "Student",
                        "User",
                        "Student User",
                        null,
                        null,
                        RoleCode.STUDENT,
                        UserStatus.ACTIVE,
                        LocalDateTime.now(),
                        LocalDateTime.now(),
                        LocalDateTime.now(),
                        false,
                        false,
                        UserLoginMethod.GOOGLE);
        when(profileService.getCurrentProfile()).thenReturn(profile);

        ProfileResponse response = profileController.getCurrentProfile();

        assertThat(response.email()).isEqualTo("student@example.com");
    }

    @Test
    void delegatesProfileUpdates() {
        UpdateProfileRequest request =
                new UpdateProfileRequest("Updated", "User", "Updated User", "+94110000000", null);
        ProfileResponse updated =
                new ProfileResponse(
                        2L,
                        "staff@example.com",
                        "Updated",
                        "User",
                        "Updated User",
                        "+94110000000",
                        null,
                        RoleCode.STAFF,
                        UserStatus.ACTIVE,
                        LocalDateTime.now(),
                        LocalDateTime.now(),
                        null,
                        true,
                        false,
                        UserLoginMethod.LOCAL);
        when(profileService.updateCurrentProfile(request)).thenReturn(updated);

        ProfileResponse response = profileController.updateCurrentProfile(request);

        assertThat(response.displayName()).isEqualTo("Updated User");
    }
}
