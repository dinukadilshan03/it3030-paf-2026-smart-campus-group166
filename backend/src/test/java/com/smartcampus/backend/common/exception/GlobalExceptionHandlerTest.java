package com.smartcampus.backend.common.exception;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void returnsAttachmentSizeMessageWhenUploadExceedsConfiguredLimit() {
        MockHttpServletRequest request =
                new MockHttpServletRequest("POST", "/api/v1/tickets/8/attachments");

        var response =
                handler.handleMaxUploadSizeExceeded(
                        new MaxUploadSizeExceededException(5L * 1024L * 1024L), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo("Attachment image must be 5 MB or smaller");
    }

    @Test
    void returnsValidationMessageForMultipartParsingErrorsThatIndicateSizeOverflow() {
        MockHttpServletRequest request =
                new MockHttpServletRequest("POST", "/api/v1/tickets/8/attachments");
        MultipartException exception =
                new MultipartException(
                        "Failed to parse multipart servlet request",
                        new IllegalStateException(
                                "The field file exceeds its maximum permitted size of 1048576 bytes."));

        var response = handler.handleMultipartException(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo("Attachment image must be 5 MB or smaller");
    }

    @Test
    void preservesClearStorageFailureMessageForAttachmentUploads() {
        MockHttpServletRequest request =
                new MockHttpServletRequest("POST", "/api/v1/tickets/8/attachments");

        var response =
                handler.handleIllegalState(
                        new IllegalStateException(
                                "Could not upload the attachment image. Confirm the ticket attachments bucket exists and Supabase storage is configured."),
                        request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message())
                .isEqualTo(
                        "Could not upload the attachment image. Confirm the ticket attachments bucket exists and Supabase storage is configured.");
    }
}
