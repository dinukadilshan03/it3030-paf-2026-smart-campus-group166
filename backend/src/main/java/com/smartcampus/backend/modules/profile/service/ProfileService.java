package com.smartcampus.backend.modules.profile.service;

import com.smartcampus.backend.common.entity.LocalAuthCredential;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserLoginMethod;
import com.smartcampus.backend.modules.auth.repository.LocalAuthCredentialRepository;
import com.smartcampus.backend.modules.auth.service.CurrentUserService;
import com.smartcampus.backend.modules.profile.dto.ProfileResponse;
import com.smartcampus.backend.modules.profile.dto.UpdateProfileRequest;
import com.smartcampus.backend.modules.user.mapper.UserMapper;
import com.smartcampus.backend.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final CurrentUserService currentUserService;
    private final LocalAuthCredentialRepository localAuthCredentialRepository;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public ProfileResponse getCurrentProfile() {
        UserRole membership = getRequiredCurrentMembership();
        return toProfileResponse(membership.getUser(), membership.getRole().getCode());
    }

    @Transactional
    public ProfileResponse updateCurrentProfile(UpdateProfileRequest request) {
        UserRole membership = getRequiredCurrentMembership();
        User user = membership.getUser();
        user.setFirstName(trimToNull(request.firstName()));
        user.setLastName(trimToNull(request.lastName()));
        user.setDisplayName(trimToNull(request.displayName()));
        user.setPhone(trimToNull(request.phone()));
        user.setProfileImageUrl(trimToNull(request.profileImageUrl()));

        User savedUser = userRepository.save(user);
        return toProfileResponse(savedUser, membership.getRole().getCode());
    }

    private UserRole getRequiredCurrentMembership() {
        return currentUserService
                .getCurrentUserRole()
                .orElseThrow(() -> new AccessDeniedException("Authenticated user context is required"));
    }

    private ProfileResponse toProfileResponse(User user, RoleCode roleCode) {
        LocalAuthCredential credential = localAuthCredentialRepository.findByUserId(user.getId()).orElse(null);
        UserLoginMethod loginMethod = roleCode == RoleCode.STUDENT ? UserLoginMethod.GOOGLE : UserLoginMethod.LOCAL;
        return userMapper.toProfile(
                user,
                roleCode,
                credential != null,
                credential != null && credential.isMustChangePassword(),
                loginMethod);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
