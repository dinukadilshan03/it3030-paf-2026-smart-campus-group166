package com.smartcampus.backend;

import static org.assertj.core.api.Assertions.assertThatCode;

import org.junit.jupiter.api.Test;

class BackendApplicationTests {

    @Test
    void mainMethodIsCallable() {
        assertThatCode(() -> BackendApplication.class.getMethod("main", String[].class))
                .doesNotThrowAnyException();
    }
}
