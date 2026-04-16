package com.smartcampus.backend.common.service;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriUtils;

@Service
@Slf4j
public class SupabaseStorageService {

    private final RestClient restClient;
    private final String supabaseUrl;
    private final String serviceRoleKey;
    private final String localStorageRoot;

    public SupabaseStorageService(
            RestClient.Builder restClientBuilder,
            @Value("${app.supabase.url:}") String supabaseUrl,
            @Value("${app.supabase.service-role-key:}") String serviceRoleKey,
            @Value("${app.storage.local-root:}") String localStorageRoot) {
        this.restClient = restClientBuilder.build();
        this.supabaseUrl = trimToEmpty(supabaseUrl);
        this.serviceRoleKey = trimToEmpty(serviceRoleKey);
        this.localStorageRoot = trimToEmpty(localStorageRoot);
    }

    public void uploadObject(String bucket, String path, byte[] content, String contentType) {
        if (!useSupabaseStorage()) {
            uploadObjectLocally(bucket, path, content, contentType);
            return;
        }

        try {
            restClient.post()
                    .uri(buildObjectUrl(bucket, path))
                    .headers(headers -> applyAuthHeaders(headers, contentType))
                    .body(content)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ex) {
            log.warn("Supabase upload failed for bucket={} path={}", bucket, path, ex);
            throw new IllegalStateException("Could not upload the attachment image.");
        }
    }

    public StoredObjectContent downloadObject(String bucket, String path) {
        if (!useSupabaseStorage()) {
            return downloadObjectLocally(bucket, path);
        }

        try {
            ResponseEntity<byte[]> response =
                    restClient.get()
                            .uri(buildAuthenticatedObjectUrl(bucket, path))
                            .headers(headers -> applyAuthHeaders(headers, null))
                            .retrieve()
                            .toEntity(byte[].class);

            byte[] body = response.getBody();
            if (body == null) {
                throw new IllegalStateException("Attachment image content was empty.");
            }

            MediaType mediaType = response.getHeaders().getContentType();
            long contentLength = response.getHeaders().getContentLength();
            return new StoredObjectContent(
                    body,
                    mediaType == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : mediaType.toString(),
                    contentLength >= 0 ? contentLength : body.length);
        } catch (RestClientException ex) {
            log.warn("Supabase download failed for bucket={} path={}", bucket, path, ex);
            throw new IllegalStateException("Could not load the attachment image.");
        }
    }

    public void deleteObject(String bucket, String path) {
        if (!useSupabaseStorage()) {
            deleteObjectLocally(bucket, path);
            return;
        }

        try {
            restClient.delete()
                    .uri(buildObjectUrl(bucket, path))
                    .headers(headers -> applyAuthHeaders(headers, null))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ex) {
            log.warn("Supabase delete failed for bucket={} path={}", bucket, path, ex);
            throw new IllegalStateException("Could not delete the attachment image.");
        }
    }

    private boolean useSupabaseStorage() {
        return isConfiguredSupabaseUrl() && isConfiguredServiceRoleKey();
    }

    private boolean isConfiguredSupabaseUrl() {
        return !supabaseUrl.isBlank()
                && !supabaseUrl.contains("<")
                && supabaseUrl.startsWith("http");
    }

    private boolean isConfiguredServiceRoleKey() {
        return !serviceRoleKey.isBlank()
                && !"your-service-role-key".equalsIgnoreCase(serviceRoleKey);
    }

    private void uploadObjectLocally(String bucket, String path, byte[] content, String contentType) {
        try {
            Path objectPath = resolveLocalObjectPath(bucket, path);
            Files.createDirectories(objectPath.getParent());
            Files.write(
                    objectPath,
                    content,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING,
                    StandardOpenOption.WRITE);

            if (contentType != null && !contentType.isBlank()) {
                Files.writeString(
                        resolveLocalContentTypePath(bucket, path),
                        contentType,
                        StandardOpenOption.CREATE,
                        StandardOpenOption.TRUNCATE_EXISTING,
                        StandardOpenOption.WRITE);
            }
        } catch (Exception ex) {
            log.warn("Local attachment write failed for bucket={} path={}", bucket, path, ex);
            throw new IllegalStateException("Could not upload the attachment image.");
        }
    }

    private StoredObjectContent downloadObjectLocally(String bucket, String path) {
        try {
            Path objectPath = resolveLocalObjectPath(bucket, path);
            byte[] content = Files.readAllBytes(objectPath);
            Path contentTypePath = resolveLocalContentTypePath(bucket, path);
            String contentType =
                    Files.exists(contentTypePath)
                            ? trimToEmpty(Files.readString(contentTypePath))
                            : trimToEmpty(Files.probeContentType(objectPath));

            return new StoredObjectContent(
                    content,
                    contentType.isBlank() ? MediaType.APPLICATION_OCTET_STREAM_VALUE : contentType,
                    content.length);
        } catch (Exception ex) {
            log.warn("Local attachment read failed for bucket={} path={}", bucket, path, ex);
            throw new IllegalStateException("Could not load the attachment image.");
        }
    }

    private void deleteObjectLocally(String bucket, String path) {
        try {
            Files.deleteIfExists(resolveLocalObjectPath(bucket, path));
            Files.deleteIfExists(resolveLocalContentTypePath(bucket, path));
        } catch (Exception ex) {
            log.warn("Local attachment delete failed for bucket={} path={}", bucket, path, ex);
            throw new IllegalStateException("Could not delete the attachment image.");
        }
    }

    private void applyAuthHeaders(HttpHeaders headers, String contentType) {
        headers.setBearerAuth(serviceRoleKey);
        headers.set("apikey", serviceRoleKey);
        headers.set("x-upsert", "false");
        if (contentType != null && !contentType.isBlank()) {
            headers.set(HttpHeaders.CONTENT_TYPE, contentType);
        }
    }

    private String buildObjectUrl(String bucket, String path) {
        return "%s/storage/v1/object/%s/%s"
                .formatted(
                        supabaseUrl,
                        UriUtils.encodePathSegment(bucket, StandardCharsets.UTF_8),
                        UriUtils.encodePath(path, StandardCharsets.UTF_8));
    }

    private String buildAuthenticatedObjectUrl(String bucket, String path) {
        return "%s/storage/v1/object/authenticated/%s/%s"
                .formatted(
                        supabaseUrl,
                        UriUtils.encodePathSegment(bucket, StandardCharsets.UTF_8),
                        UriUtils.encodePath(path, StandardCharsets.UTF_8));
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private Path resolveLocalObjectPath(String bucket, String path) {
        Path bucketRoot = getLocalStorageRoot().resolve(bucket).normalize();
        Path objectPath = bucketRoot.resolve(path).normalize();
        if (!objectPath.startsWith(bucketRoot)) {
            throw new IllegalArgumentException("Attachment storage path is invalid.");
        }
        return objectPath;
    }

    private Path resolveLocalContentTypePath(String bucket, String path) {
        Path objectPath = resolveLocalObjectPath(bucket, path);
        return Paths.get(objectPath.toString() + ".content-type");
    }

    private Path getLocalStorageRoot() {
        if (!localStorageRoot.isBlank()) {
            return Paths.get(localStorageRoot).toAbsolutePath().normalize();
        }
        return Paths.get(System.getProperty("user.dir"), ".local-storage").toAbsolutePath().normalize();
    }
}
