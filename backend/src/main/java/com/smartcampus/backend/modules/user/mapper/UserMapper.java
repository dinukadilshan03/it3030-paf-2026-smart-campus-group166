package com.smartcampus.backend.modules.user.mapper;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.modules.auth.dto.CurrentUserResponse;
import com.smartcampus.backend.modules.user.dto.UserDetailResponse;
import com.smartcampus.backend.modules.user.dto.UserSummaryResponse;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserSummaryResponse toSummary(User user, RoleCode role) {
        return new UserSummaryResponse(
                user.getId(),
                user.getEmail(),
                resolveDisplayName(user),
                role,
                user.getStatus(),
                user.getLastLoginAt());
    }

    public UserDetailResponse toDetail(User user, RoleCode role) {
        return new UserDetailResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                resolveDisplayName(user),
                user.getPhone(),
                user.getProfileImageUrl(),
                role,
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                user.getLastLoginAt());
    }

    public CurrentUserResponse toCurrentUser(User user, RoleCode role, boolean passwordChangeRequired) {
        return new CurrentUserResponse(
                true,
                user.getId(),
                user.getEmail(),
                resolveDisplayName(user),
                role,
                user.getStatus(),
                passwordChangeRequired);
    }

    public CurrentUserResponse anonymousCurrentUser() {
        return new CurrentUserResponse(false, null, null, null, null, null, false);
    }

    public void applyUpdates(User user, String firstName, String lastName, String displayName, String phone, String profileImageUrl) {
        if (firstName != null) {
            user.setFirstName(firstName);
        }
        if (lastName != null) {
            user.setLastName(lastName);
        }
        if (displayName != null) {
            user.setDisplayName(displayName);
        }
        if (phone != null) {
            user.setPhone(phone);
        }
        if (profileImageUrl != null) {
            user.setProfileImageUrl(profileImageUrl);
        }
    }

    private String resolveDisplayName(User user) {
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName();
        }
        String fullName =
                ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                                + (user.getLastName() == null ? "" : user.getLastName()))
                        .trim();
        return fullName.isBlank() ? user.getEmail() : fullName;
    }
}
