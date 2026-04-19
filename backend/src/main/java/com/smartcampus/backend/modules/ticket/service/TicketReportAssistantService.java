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

    // HTTP client used to call the external AI assistant API
    private final RestClient restClient;

    // Used to parse JSON responses from the assistant
    private final ObjectMapper objectMapper;

    // Handles access control and identifies the current user's membership
    private final TicketAccessService ticketAccessService;

    // Repository for resolving ticket categories mentioned by the assistant
    private final TicketCategoryRepository ticketCategoryRepository;

    // Repository for resolving location names into IDs
    private final LocationRepository locationRepository;

    // Repository for resolving resource names into IDs
    private final ResourceRepository resourceRepository;

    // API key for the assistant service
    private final String apiKey;

    // Model name used when calling the assistant
    private final String model;

    // Base URL of the assistant API
    private final String baseUrl;

    // Frontend URL sent as referer header when calling the assistant
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
        // Build the RestClient instance
        this.restClient = restClientBuilder.build();
        this.objectMapper = objectMapper;
        this.ticketAccessService = ticketAccessService;
        this.ticketCategoryRepository = ticketCategoryRepository;
        this.locationRepository = locationRepository;
        this.resourceRepository = resourceRepository;

        // Normalize configuration values
        this.apiKey = trimToEmpty(apiKey);
        this.model = trimToEmpty(model).isBlank() ? "openrouter/auto" : trimToEmpty(model);
        this.baseUrl = trimTrailingSlash(baseUrl);
        this.frontendUrl = trimToEmpty(frontendUrl);
    }

    public TicketReportAssistantResponse interpret(
            TicketReportAssistantInterpretRequest request) {
        // If the assistant is not configured, return a friendly unavailable response
        if (!assistantEnabled()) {
            return new TicketReportAssistantResponse(
                    false,
                    true,
                    "The report assistant is unavailable because Ticketing_API_KEY is not configured.",
                    "Assistant unavailable",
                    null);
        }

        // Get the current user's membership and role
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();

        // Send the natural language message to the assistant
        String content = callAssistant(membership, request.message());

        // Parse the JSON content returned by the assistant
        JsonNode parsedResponse = parseAssistantPayload(content);

        // Convert the parsed JSON into the internal report request DTO
        GenerateTicketReportRequest interpretedRequest = buildRequest(parsedResponse, membership);

        // Return both the interpretation summary and the structured request
        return new TicketReportAssistantResponse(
                true,
                parsedResponse.path("needsClarification").asBoolean(false),
                textValue(parsedResponse, "clarificationQuestion"),
                buildInterpretationSummary(parsedResponse, interpretedRequest),
                interpretedRequest);
    }

    private String callAssistant(UserRole membership, String userMessage) {
        // Build the request body for the external chat completion API
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
            // Send the request to the assistant API
            JsonNode response =
                    restClient.post()
                            .uri(baseUrl + "/chat/completions")
                            .headers(this::applyAssistantHeaders)
                            .body(requestBody)
                            .retrieve()
                            .body(JsonNode.class);

            // Validate that a response was actually returned
            if (response == null) {
                throw new IllegalStateException("Ticket report assistant returned an empty response.");
            }

            // Extract text content from the response payload
            String content = extractContent(response);
            if (content == null || content.isBlank()) {
                throw new IllegalStateException("Ticket report assistant returned no usable content.");
            }
            return content;
        } catch (RestClientException ex) {
            // Log communication failures and throw a generic application exception
            log.warn("Ticket report assistant request failed", ex);
            throw new IllegalStateException("The ticket report assistant could not be reached.");
        }
    }

    private void applyAssistantHeaders(HttpHeaders headers) {
        // Set authentication and JSON content headers
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        // Include referer if frontend URL is configured
        if (!frontendUrl.isBlank()) {
            headers.set("HTTP-Referer", frontendUrl);
        }

        // Set application title header for the assistant provider
        headers.set("X-Title", "Smart Campus Ticketing");
    }

    private String buildSystemPrompt(UserRole membership) {
        // Load all categories so the AI can map human language into valid categories
        List<TicketCategory> categories =
                ticketCategoryRepository.findAll().stream()
                        .sorted(Comparator.comparing(TicketCategory::getName, String.CASE_INSENSITIVE_ORDER))
                        .toList();

        // Build a compact category reference list for the prompt
        String categoryLines =
                categories.stream()
                        .map(category -> category.getCode() + " = " + category.getName())
                        .reduce((left, right) -> left + "; " + right)
                        .orElse("No categories configured");

        // System prompt instructing the model to return only structured JSON
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
        // Extract the JSON object from the assistant response text
        String jsonCandidate = extractJsonObject(content);
        try {
            return objectMapper.readTree(jsonCandidate);
        } catch (Exception ex) {
            // Fail if the assistant returned invalid or unreadable JSON
            log.warn("Could not parse assistant response payload: {}", content, ex);
            throw new IllegalStateException(
                    "The ticket report assistant returned an unreadable response.");
        }
    }

    private GenerateTicketReportRequest buildRequest(JsonNode node, UserRole membership) {
        // Determine scope requested by the assistant
        String scope = normalizeEnumText(textValue(node, "scope"));
        Long currentUserId = membership.getUser().getId();
        RoleCode roleCode = membership.getRole().getCode();

        Long reporterUserId = null;
        Long assignedStaffUserId = null;

        // Apply role-based scope restrictions
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

        // Parse enum filters, applying defaults where appropriate
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

        // Resolve category, location, and resource names into database IDs
        Long ticketCategoryId =
                resolveCategoryId(textValue(node, "ticketCategoryCode"), textValue(node, "ticketCategoryName"));
        Long locationId = resolveLocationId(textValue(node, "locationName"));
        Long resourceId = resolveResourceId(textValue(node, "resourceName"), locationId);

        // Build the final internal request object
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
        // Prefer exact category code lookup if code is provided
        String normalizedCode = trimToNull(categoryCode);
        if (normalizedCode != null) {
            return ticketCategoryRepository
                    .findByCodeIgnoreCase(normalizedCode)
                    .map(TicketCategory::getId)
                    .orElse(null);
        }

        // Otherwise try matching by normalized category name
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
        // Normalize location name for matching
        String normalized = normalizeLookupText(locationName);
        if (normalized == null) {
            return null;
        }

        // First try exact name/code matches
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

        // If exact match fails, try partial matches
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
        // Normalize resource name for matching
        String normalized = normalizeLookupText(resourceName);
        if (normalized == null) {
            return null;
        }

        // Search resources, optionally narrowed by location
        List<Resource> candidates =
                resourceRepository.searchResources(null, locationId, null, null, normalized);

        // First try exact name/code matches
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

        // Then try partial matches
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
        // Use assistant-provided summary if available
        String explicitSummary = trimToNull(textValue(node, "interpretationSummary"));
        if (explicitSummary != null) {
            return explicitSummary;
        }

        // Otherwise construct a fallback summary from interpreted fields
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
        // Read the first choice returned by the chat completion API
        JsonNode choices = response.path("choices");
        if (!choices.isArray() || choices.isEmpty()) {
            return null;
        }

        JsonNode messageContent = choices.get(0).path("message").path("content");

        // Content may be plain text
        if (messageContent.isTextual()) {
            return messageContent.asText();
        }

        // Or content may be returned as an array of text blocks
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
        // Extract the outermost JSON object from a text response
        int start = content.indexOf('{');
        int end = content.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return content.substring(start, end + 1);
        }
        return content;
    }

    private <T extends Enum<T>> T parseEnum(Class<T> enumType, String value, T fallback) {
        // Normalize the value and safely parse it into an enum
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
        // Read a numeric field whether it is stored as a number or string
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
        // Safely parse a date string into LocalDate
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
        // Return the text value of a JSON field if present
        JsonNode field = node.path(fieldName);
        return field.isTextual() ? field.asText() : null;
    }

    private boolean containsNormalized(String source, String expectedPart) {
        // Compare normalized strings for partial containment
        String normalizedSource = normalizeLookupText(source);
        return normalizedSource != null && normalizedSource.contains(expectedPart);
    }

    private boolean assistantEnabled() {
        // Assistant is enabled only when an API key exists and is not a placeholder
        return !apiKey.isBlank() && !"your-openrouter-key".equalsIgnoreCase(apiKey);
    }

    private String normalizeLookupText(String value) {
        // Normalize text for matching names/codes in a forgiving way
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
        // Normalize text into enum-style uppercase with underscores
        String normalized = trimToNull(value);
        return normalized == null ? null : normalized.toUpperCase(Locale.ROOT).replace(' ', '_');
    }

    private String trimTrailingSlash(String value) {
        // Remove a trailing slash from URL-like strings
        String trimmed = trimToEmpty(value);
        return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
    }

    private String trimToEmpty(String value) {
        // Convert null to empty string, otherwise trim whitespace
        return value == null ? "" : value.trim();
    }

    private String trimToNull(String value) {
        // Convert blank strings to null after trimming
        String trimmed = trimToEmpty(value);
        return trimmed.isBlank() ? null : trimmed;
    }
}