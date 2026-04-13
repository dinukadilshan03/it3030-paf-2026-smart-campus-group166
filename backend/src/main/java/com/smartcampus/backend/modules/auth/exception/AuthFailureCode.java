package com.smartcampus.backend.modules.auth.exception;

import java.util.Arrays;
import java.util.Optional;

public enum AuthFailureCode {
    OAUTH_FAILED("oauth_failed"),
    ACCOUNT_BLOCKED("account_blocked"),
    INVALID_PROFILE("invalid_profile"),
    PROVISIONING_FAILED("provisioning_failed"),
    OAUTH_NOT_ALLOWED("oauth_not_allowed"),
    LOCAL_LOGIN_NOT_ALLOWED("local_login_not_allowed"),
    INVALID_CREDENTIALS("invalid_credentials"),
    PASSWORD_CHANGE_REQUIRED("password_change_required");

    private final String queryValue;

    AuthFailureCode(String queryValue) {
        this.queryValue = queryValue;
    }

    public String getQueryValue() {
        return queryValue;
    }

    public static Optional<AuthFailureCode> fromQueryValue(String value) {
        return Arrays.stream(values())
                .filter(code -> code.queryValue.equalsIgnoreCase(value))
                .findFirst();
    }
}
