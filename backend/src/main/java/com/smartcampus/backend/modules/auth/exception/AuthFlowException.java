package com.smartcampus.backend.modules.auth.exception;

public class AuthFlowException extends RuntimeException {

    private final AuthFailureCode failureCode;

    public AuthFlowException(AuthFailureCode failureCode, String message) {
        super(message);
        this.failureCode = failureCode;
    }

    public AuthFailureCode getFailureCode() {
        return failureCode;
    }
}
