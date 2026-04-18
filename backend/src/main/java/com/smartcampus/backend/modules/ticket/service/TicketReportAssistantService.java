package com.smartcampus.backend.modules.ticket.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.TicketPriority;
import com.smartcampus.backend.common.enums.TicketReportFormat;
import com.smartcampus.backend.common.enums.TicketReportType;
import com.smartcampus.backend.common.enums.TicketStatus;
import com.smartcampus.backend.modules.resource.entity.Location;
import com.smartcampus.backend.modules.resource.entity.Resource;
import com.smartcampus.backend.modules.resource.repository.LocationRepository;
import com.smartcampus.backend.modules.resource.repository.ResourceRepository;
import com.smartcampus.backend.modules.ticket.dto.GenerateTicketReportRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketReportAssistantInterpretRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketReportAssistantResponse;
import com.smartcampus.backend.modules.ticket.entity.TicketCategory;
import com.smartcampus.backend.modules.ticket.repository.TicketCategoryRepository;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
@Slf4j
public class TicketReportAssistantService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final TicketAccessService ticketAccessService;
    private final TicketCategoryRepository ticketCategoryRepository;
    private final LocationRepository locationRepository;
    private final ResourceRepository resourceRepository;
    private final String apiKey;
    private final String model;
    private final String baseUrl;
    private final String frontendUrl;

    public TicketReportAssistantService(
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            TicketAccessService ticketAccessService,
            TicketCategoryRepository ticketCategoryRepository,
            LocationRepository locationRepository,
            ResourceRepository resourceRepository,
            @Value("${app.ticketing.assistant.api-key:}") String apiKey,
            @Value("${app.ticketing.assistant.model:openrouter/auto}") String model,
            @Value("${app.ticketing.assistant.base-url:https://openrouter.ai/api/v1}") String baseUrl,
            @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl) {
        this.restClient = restClientBuilder.build();
        this.objectMapper = objectMapper;
        this.ticketAccessService = ticketAccessService;
        this.ticketCategoryRepository = ticketCategoryRepository;
        this.locationRepository = locationRepository;
        this.resourceRepository = resourceRepository;
        this.apiKey = trimToEmpty(apiKey);
        this.model = trimToEmpty(model).isBlank() ? "openrouter/auto" : trimToEmpty(model);
        this.baseUrl = trimTrailingSlash(baseUrl);
        this.frontendUrl = trimToEmpty(frontendUrl);
    }

    public TicketReportAssistantResponse interpret(
            TicketReportAssistantInterpretRequest request) {
        if (!assistantEnabled()) {
            return new TicketReportAssistantResponse(
                    false,
                    true,
                    "The report assistant is unavailable because Ticketing_API_KEY is not configured.",
                    "Assistant unavailable",
                    null);
        }

        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        String content = callAssistant(membership, request.message());
        JsonNode parsedResponse = parseAssistantPayload(content);
        GenerateTicketReportRequest interpretedRequest = buildRequest(parsedResponse, membership);

        return new TicketReportAssistantResponse(
                true,
                parsedResponse.path("needsClarification").asBoolean(false),
                textValue(parsedResponse, "clarificationQuestion"),
                buildInterpretationSummary(parsedResponse, interpretedRequest),
                interpretedRequest);
    }

    private String callAssistant(UserRole membership, String userMessage) {
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", model);
        requestBody.put("temperature", 0.1);
        requestBody.put("max_tokens", 700);
        requestBody.put(
                "messages",
                List.of(
                        Map.of("role", "system", "content", buildSystemPrompt(membership)),
                        Map.of("role", "user", "content", userMessage)));

        try {
            JsonNode response =
                    restClient.post()
                            .uri(baseUrl + "/chat/completions")
                            .headers(this::applyAssistantHeaders)
                            .body(requestBody)
                            .retrieve()
                            .body(JsonNode.class);

            if (response == null) {
                throw new IllegalStateException("Ticket report assistant returned an empty response.");
            }

            String content = extractContent(response);
            if (content == null || content.isBlank()) {
                throw new IllegalStateException("Ticket report assistant returned no usable content.");
            }
            return content;
        } catch (RestClientException ex) {
            log.warn("Ticket report assistant request failed", ex);
            throw new IllegalStateException("The ticket report assistant could not be reached.");
        }
    }

    private void applyAssistantHeaders(HttpHeaders headers) {
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        if (!frontendUrl.isBlank()) {
            headers.set("HTTP-Referer", frontendUrl);
        }
        headers.set("X-Title", "Smart Campus Ticketing");
    }

    private String buildSystemPrompt(UserRole membership) {
        List<TicketCategory> categories =
                ticketCategoryRepository.findAll().stream()
                        .sorted(Comparator.comparing(TicketCategory::getName, String.CASE_INSENSITIVE_ORDER))
                        .toList();
        String categoryLines =
                categories.stream()
                        .map(category -> category.getCode() + " = " + category.getName())
                        .reduce((left, right) -> left + "; " + right)
                        .orElse("No categories configured");

        return """
                You translate natural-language ticket report requests into JSON for a campus maintenance ticketing system.
                Today's date is %s.
                Current user role is %s.
                Allowed reportType values: SUMMARY, DETAIL.
                Allowed format values: PDF only.
                Allowed status values: OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED.
                Allowed priority values: LOW, MEDIUM, HIGH, URGENT.
                Known ticket categories: %s.

                Return only JSON with these keys:
                needsClarification (boolean),
                clarificationQuestion (string or null),
                interpretationSummary (string),
                reportType (SUMMARY or DETAIL),
                format (PDF),
                status (enum or null),
                priority (enum or null),
                ticketId (number or null),
                ticketNumber (string or null),
                ticketCategoryCode (string or null),
                ticketCategoryName (string or null),
                startDate (YYYY-MM-DD or null),
                endDate (YYYY-MM-DD or null),
                locationName (string or null),
                resourceName (string or null),
                scope (MY_SCOPE, MY_REPORTED, MY_ASSIGNED, ALL, or null).

                Rules:
                - If the user asks for "my tickets", do not ask clarifying questions.
                - If a specific ticket number is mentioned, prefer DETAIL unless the user explicitly asks for a list.
                - Resolve relative periods like "this month" or "last 30 days" into exact calendar dates.
                - Keep fields null when unknown.
                - Do not include Markdown or explanation outside the JSON object.
                """
                .formatted(LocalDate.now(), membership.getRole().getCode().name(), categoryLines);
    }

    private JsonNode parseAssistantPayload(String content) {
        String jsonCandidate = extractJsonObject(content);
        try {
            return objectMapper.readTree(jsonCandidate);
        } catch (Exception ex) {
            log.warn("Could not parse assistant response payload: {}", content, ex);
            throw new IllegalStateException(
                    "The ticket report assistant returned an unreadable response.");
        }
    }

    private GenerateTicketReportRequest buildRequest(JsonNode node, UserRole membership) {
        String scope = normalizeEnumText(textValue(node, "scope"));
        Long currentUserId = membership.getUser().getId();
        RoleCode roleCode = membership.getRole().getCode();

        Long reporterUserId = null;
        Long assignedStaffUserId = null;
        if (roleCode == RoleCode.STUDENT) {
            reporterUserId = currentUserId;
        } else if (roleCode == RoleCode.STAFF) {
            if ("MY_REPORTED".equals(scope)) {
                reporterUserId = currentUserId;
            } else if ("MY_ASSIGNED".equals(scope)) {
                assignedStaffUserId = currentUserId;
            }
        } else if (roleCode == RoleCode.ADMIN) {
            if ("MY_REPORTED".equals(scope)) {
                reporterUserId = currentUserId;
            } else if ("MY_ASSIGNED".equals(scope)) {
                assignedStaffUserId = currentUserId;
            }
        }

        TicketReportType reportType =
                parseEnum(
                        TicketReportType.class,
                        textValue(node, "reportType"),
                        numericValue(node, "ticketId") != null
                                        || textValue(node, "ticketNumber") != null
                                ? TicketReportType.DETAIL
                                : TicketReportType.SUMMARY);
        TicketStatus status = parseEnum(TicketStatus.class, textValue(node, "status"), null);
        TicketPriority priority = parseEnum(TicketPriority.class, textValue(node, "priority"), null);

        Long ticketCategoryId =
                resolveCategoryId(textValue(node, "ticketCategoryCode"), textValue(node, "ticketCategoryName"));
        Long locationId = resolveLocationId(textValue(node, "locationName"));
        Long resourceId = resolveResourceId(textValue(node, "resourceName"), locationId);

        return new GenerateTicketReportRequest(
                numericValue(node, "ticketId"),
                trimToNull(textValue(node, "ticketNumber")),
                reportType,
                TicketReportFormat.PDF,
                status,
                priority,
                ticketCategoryId,
                locationId,
                resourceId,
                assignedStaffUserId,
                reporterUserId,
                parseLocalDate(textValue(node, "startDate")),
                parseLocalDate(textValue(node, "endDate")),
                null);
    }

    private Long resolveCategoryId(String categoryCode, String categoryName) {
        String normalizedCode = trimToNull(categoryCode);
        if (normalizedCode != null) {
            return ticketCategoryRepository
                    .findByCodeIgnoreCase(normalizedCode)
                    .map(TicketCategory::getId)
                    .orElse(null);
        }

        String normalizedName = normalizeLookupText(categoryName);
        if (normalizedName == null) {
            return null;
        }

        return ticketCategoryRepository.findAll().stream()
                .filter(category -> normalizedName.equals(normalizeLookupText(category.getName())))
                .map(TicketCategory::getId)
                .findFirst()
                .orElse(null);
    }

    private Long resolveLocationId(String locationName) {
        String normalized = normalizeLookupText(locationName);
        if (normalized == null) {
            return null;
        }

        List<Location> exactMatches =
                locationRepository.findAll().stream()
                        .filter(
                                location ->
                                        normalized.equals(normalizeLookupText(location.getName()))
                                                || normalized.equals(normalizeLookupText(location.getCode())))
                        .toList();
        if (exactMatches.size() == 1) {
            return exactMatches.getFirst().getId();
        }

        List<Location> partialMatches =
                locationRepository.findAll().stream()
                        .filter(
                                location ->
                                        containsNormalized(location.getName(), normalized)
                                                || containsNormalized(location.getCode(), normalized))
                        .toList();
        return partialMatches.size() == 1 ? partialMatches.getFirst().getId() : null;
    }

    private Long resolveResourceId(String resourceName, Long locationId) {
        String normalized = normalizeLookupText(resourceName);
        if (normalized == null) {
            return null;
        }

        List<Resource> candidates =
                resourceRepository.searchResources(null, locationId, null, null, normalized);
        List<Resource> exactMatches =
                candidates.stream()
                        .filter(
                                resource ->
                                        normalized.equals(normalizeLookupText(resource.getName()))
                                                || normalized.equals(
                                                        normalizeLookupText(resource.getResourceCode())))
                        .toList();
        if (exactMatches.size() == 1) {
            return exactMatches.getFirst().getId();
        }

        List<Resource> partialMatches =
                candidates.stream()
                        .filter(
                                resource ->
                                        containsNormalized(resource.getName(), normalized)
                                                || containsNormalized(resource.getResourceCode(), normalized))
                        .toList();
        return partialMatches.size() == 1 ? partialMatches.getFirst().getId() : null;
    }

    private String buildInterpretationSummary(JsonNode node, GenerateTicketReportRequest request) {
        String explicitSummary = trimToNull(textValue(node, "interpretationSummary"));
        if (explicitSummary != null) {
            return explicitSummary;
        }

        List<String> fragments = new ArrayList<>();
        fragments.add(
                request.reportType() == TicketReportType.DETAIL
                        ? "Detailed ticket report"
                        : "Ticket summary report");
        fragments.add("format " + request.format().name());
        if (request.status() != null) {
            fragments.add("status " + request.status().name());
        }
        if (request.priority() != null) {
            fragments.add("priority " + request.priority().name());
        }
        if (request.ticketNumber() != null) {
            fragments.add("ticket " + request.ticketNumber());
        }
        if (request.startDate() != null || request.endDate() != null) {
            fragments.add(
                    "date range "
                            + (request.startDate() == null ? "any time" : request.startDate())
                            + " to "
                            + (request.endDate() == null ? "today" : request.endDate()));
        }
        return String.join(", ", fragments);
    }

    private String extractContent(JsonNode response) {
        JsonNode choices = response.path("choices");
        if (!choices.isArray() || choices.isEmpty()) {
            return null;
        }

        JsonNode messageContent = choices.get(0).path("message").path("content");
        if (messageContent.isTextual()) {
            return messageContent.asText();
        }
        if (messageContent.isArray()) {
            StringBuilder builder = new StringBuilder();
            for (JsonNode entry : messageContent) {
                String text = textValue(entry, "text");
                if (text == null && entry.isTextual()) {
                    text = entry.asText();
                }
                if (text != null) {
                    if (!builder.isEmpty()) {
                        builder.append('\n');
                    }
                    builder.append(text);
                }
            }
            return builder.toString();
        }
        return null;
    }

    private String extractJsonObject(String content) {
        int start = content.indexOf('{');
        int end = content.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return content.substring(start, end + 1);
        }
        return content;
    }

    private <T extends Enum<T>> T parseEnum(Class<T> enumType, String value, T fallback) {
        String normalized = normalizeEnumText(value);
        if (normalized == null) {
            return fallback;
        }
        try {
            return Enum.valueOf(enumType, normalized);
        } catch (IllegalArgumentException ex) {
            return fallback;
        }
    }

    private Long numericValue(JsonNode node, String fieldName) {
        JsonNode field = node.path(fieldName);
        if (field.isNumber()) {
            return field.longValue();
        }
        if (field.isTextual()) {
            try {
                return Long.parseLong(field.asText().trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private LocalDate parseLocalDate(String value) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            return null;
        }
        try {
            return LocalDate.parse(normalized);
        } catch (DateTimeParseException ex) {
            return null;
        }
    }

    private String textValue(JsonNode node, String fieldName) {
        JsonNode field = node.path(fieldName);
        return field.isTextual() ? field.asText() : null;
    }

    private boolean containsNormalized(String source, String expectedPart) {
        String normalizedSource = normalizeLookupText(source);
        return normalizedSource != null && normalizedSource.contains(expectedPart);
    }

    private boolean assistantEnabled() {
        return !apiKey.isBlank() && !"your-openrouter-key".equalsIgnoreCase(apiKey);
    }

    private String normalizeLookupText(String value) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            return null;
        }
        return normalized
                .toLowerCase(Locale.ROOT)
                .replace('&', ' ')
                .replaceAll("[^a-z0-9]+", " ")
                .trim();
    }

    private String normalizeEnumText(String value) {
        String normalized = trimToNull(value);
        return normalized == null ? null : normalized.toUpperCase(Locale.ROOT).replace(' ', '_');
    }

    private String trimTrailingSlash(String value) {
        String trimmed = trimToEmpty(value);
        return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private String trimToNull(String value) {
        String trimmed = trimToEmpty(value);
        return trimmed.isBlank() ? null : trimmed;
    }
}
