package com.smartcampus.backend.modules.user.controller;

import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.modules.user.dto.UpdateUserRequest;
import com.smartcampus.backend.modules.user.dto.UpdateUserRoleRequest;
import com.smartcampus.backend.modules.user.dto.UpdateUserStatusRequest;
import com.smartcampus.backend.modules.user.dto.UserDetailResponse;
import com.smartcampus.backend.modules.user.dto.UserSummaryResponse;
import com.smartcampus.backend.modules.user.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserSummaryResponse> getUsers(
            @RequestParam(required = false) RoleCode role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String search) {
        return userService.getUsers(role, status, search);
    }

    @GetMapping("/{id}")
    public UserDetailResponse getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @PatchMapping("/{id}")
    public UserDetailResponse updateUser(
            @PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        return userService.updateUser(id, request);
    }

    @PatchMapping("/{id}/role")
    public UserDetailResponse updateUserRole(
            @PathVariable Long id, @Valid @RequestBody UpdateUserRoleRequest request) {
        return userService.updateUserRole(id, request.role());
    }

    @PatchMapping("/{id}/status")
    public UserDetailResponse updateUserStatus(
            @PathVariable Long id, @Valid @RequestBody UpdateUserStatusRequest request) {
        return userService.updateUserStatus(id, request.status());
    }
}
