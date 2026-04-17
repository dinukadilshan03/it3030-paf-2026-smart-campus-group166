package com.smartcampus.backend.common.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.web.client.RestClient;

class SupabaseStorageServiceTest {

    @TempDir Path tempDir;

    @Test
    void fallsBackToLocalStorageWhenSupabaseConfigIsPlaceholder() {
        SupabaseStorageService storageService =
                new SupabaseStorageService(
                        RestClient.builder(),
                        "https://<project-ref>.supabase.co",
                        "your-service-role-key",
                        tempDir.toString());

        byte[] content = "image-bytes".getBytes(StandardCharsets.UTF_8);

        storageService.uploadObject("ticket-attachments", "tickets/TCK-1/example.jpg", content, "image/jpeg");

        StoredObjectContent downloaded =
                storageService.downloadObject("ticket-attachments", "tickets/TCK-1/example.jpg");

        assertThat(downloaded.content()).isEqualTo(content);
        assertThat(downloaded.contentType()).isEqualTo("image/jpeg");

        storageService.deleteObject("ticket-attachments", "tickets/TCK-1/example.jpg");

        Path storedFile = tempDir.resolve("ticket-attachments").resolve("tickets").resolve("TCK-1").resolve("example.jpg");
        assertThat(storedFile).doesNotExist();
    }
}
