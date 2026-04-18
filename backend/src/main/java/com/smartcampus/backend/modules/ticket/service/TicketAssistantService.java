package com.smartcampus.backend.modules.ticket.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.CommentType;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.TicketAssistantIntent;
import com.smartcampus.backend.common.enums.TicketPriority;
import com.smartcampus.backend.common.enums.TicketStatus;
import com.smartcampus.backend.modules.ticket.dto.GenerateTicketReportRequest;
import com.smartcampus.backend.modules.ticket.dto.RefineTicketDescriptionRequest;
import com.smartcampus.backend.modules.ticket.dto.RefineTicketDescriptionResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketAssistantQueryRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketAssistantResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketCommentResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketDetailResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketReportAssistantInterpretRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketReportAssistantResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketSummaryResponse;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketCategory;
import com.smartcampus.backend.modules.ticket.mapper.TicketMapper;
import com.smartcampus.backend.modules.ticket.repository.TicketCategoryRepository;
import com.smartcampus.backend.modules.ticket.repository.TicketRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketAssistantService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private static final Pattern TICKET_NUMBER_PATTERN =
            Pattern.compile("\\bTCK-[A-Z0-9-]+\\b", Pattern.CASE_INSENSITIVE);
    private static final Set<String> STOP_WORDS =
            Set.of(
                    "a",
                    "an",
                    "and",
                    "are",
                    "as",
                    "at",
                    "be",
                    "can",
                    "for",
                    "from",
                    "has",
                    "have",
                    "how",
                    "i",
                    "in",
                    "is",
                    "it",
                    "me",
                    "my",
                    "of",
                    "on",
                    "or",
                    "please",
                    "show",
                    "the",
                    "this",
                    "ticket",
                    "tickets",
                    "to",
                    "what",
                    "which",
                    "with");
    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("dd MMM yyyy, h:mm a", Locale.ROOT);

    private final TicketService ticketService;
    private final TicketCommentService ticketCommentService;
    private final TicketAccessService ticketAccessService;
    private final TicketReportAssistantService ticketReportAssistantService;
    private final TicketRepository ticketRepository;
    private final TicketCategoryRepository ticketCategoryRepository;
    private final TicketMapper ticketMapper;
    private final RestClient.Builder restClientBuilder;

    @Value("${app.ticketing.assistant.api-key:}")
    private String apiKey;

    @Value("${app.ticketing.assistant.model:openrouter/auto}")
    private String model;

    @Value("${app.ticketing.assistant.base-url:https://openrouter.ai/api/v1}")
    private String baseUrl;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public TicketAssistantResponse query(TicketAssistantQueryRequest request) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        if (membership.getRole().getCode() != RoleCode.STUDENT) {
            throw new AccessDeniedException("The ticket assistant is available only for students.");
        }
        String message = request.message().trim();
        TicketContext selectedContext = resolveSelectedContext(membership, request.selectedTicketId());
        List<TicketSummaryResponse> scopedTickets = ticketService.getTickets(null, null, null, null);

        TicketAssistantResponse openRouterResponse =
                handleOpenRouterQuery(membership, message, scopedTickets, selectedContext);
        if (openRouterResponse != null) {
            return openRouterResponse;
        }

        TicketAssistantIntent intent = resolveIntent(message, selectedContext != null);

        return switch (intent) {
            case REPORT_HELP -> handleReportHelp(message);
            case FAQ -> handleFaq(membership, message);
            case HISTORY_SUMMARY -> handleHistorySummary(membership, message, scopedTickets, selectedContext);
            case DUPLICATE_CHECK -> handleDuplicateCheck(membership, message, selectedContext);
            case COMMENT_ASSISTANT -> handleCommentAssistant(membership, message, scopedTickets, selectedContext);
            case CATEGORY_RECOMMENDATION,
                    PRIORITY_RECOMMENDATION,
                    CREATION_HELP -> handleCreationGuidance(intent, membership, message, selectedContext);
            case REMINDER -> handleReminder(membership, scopedTickets);
            case RESOLUTION_EXPLANATION ->
                    handleResolutionExplanation(membership, message, scopedTickets, selectedContext);
            case INSIGHTS -> handleInsights(membership, scopedTickets);
            case STATUS_QUERY -> handleStatusQuery(membership, message, scopedTickets, selectedContext);
            case UNKNOWN -> handleUnknown(membership, scopedTickets, selectedContext);
        };
    }

    public RefineTicketDescriptionResponse refineDescription(RefineTicketDescriptionRequest request) {
        String title = blankToNull(request.title());
        String description = request.description().trim();
        String improvedDescription = buildPolishedFormDescription(title, description);

        return new RefineTicketDescriptionResponse(
                assistantEnabled(),
                blankToNull(improvedDescription) == null ? description : improvedDescription);
    }

    private TicketAssistantResponse handleReportHelp(String message) {
        TicketReportAssistantResponse response =
                ticketReportAssistantService.interpret(new TicketReportAssistantInterpretRequest(message));
        return buildResponse(
                TicketAssistantIntent.REPORT_HELP,
                "Report assistant",
                coalesce(
                        response.clarificationQuestion(),
                        response.interpretationSummary(),
                        "The report request is ready."),
                response.clarificationQuestion() == null
                        ? List.of(
                                "The assistant filled the report builder filters.",
                                "You can generate the file immediately or adjust the filters first.")
                        : List.of("Add the missing details and run the assistant again."),
                response.clarificationQuestion() == null
                        ? List.of("Generate the report now", "Review the report filters")
                        : List.of("Clarify the request", "Open the manual report builder"),
                List.of(),
                null,
                null,
                null,
                null,
                null,
                null,
                response.interpretedRequest(),
                response.interpretationSummary());
    }

    private TicketAssistantResponse handleFaq(UserRole membership, String message) {
        String normalized = normalizeText(message);
        List<String> highlights = new ArrayList<>();
        List<String> actions = new ArrayList<>();
        String answer;

        if (normalized.contains("create") || normalized.contains("submit") || normalized.contains("report")) {
            answer =
                    "Create a ticket with a title, category, description, priority, and either a resource or location. You can also add preferred contact details and up to three image attachments.";
            highlights.add("A resource or location is required.");
            highlights.add("Images are optional and limited to three.");
            actions.add("Open the create-ticket form");
        } else if (normalized.contains("image")
                || normalized.contains("attachment")
                || normalized.contains("upload")) {
            answer =
                    "You can upload up to three image attachments per ticket. File details are captured automatically when the image is selected.";
            highlights.add("Image uploads are limited to three files.");
            highlights.add("Format and file details are filled automatically.");
            actions.add("Add images from the ticket form");
        } else if (normalized.contains("resolved")) {
            answer =
                    "RESOLVED means staff recorded that the issue was fixed and added a resolution summary. Admin still closes the ticket afterward.";
            highlights.add("RESOLVED is not the final admin closure step.");
            highlights.add("CLOSED is the final completed state.");
            actions.add("Ask for the selected ticket's outcome explanation");
        } else if (normalized.contains("view") || normalized.contains("who can")) {
            answer =
                    switch (membership.getRole().getCode()) {
                        case ADMIN ->
                                "Admins can view every ticket. Students can view the tickets they reported, and staff can view tickets assigned to them plus tickets they reported.";
                        case STAFF ->
                                "You can view tickets assigned to you and tickets you reported. Admin can view all tickets.";
                        case STUDENT ->
                                "You can view the tickets you reported. Staff can see tickets assigned to them, and admin can view all tickets.";
                    };
            highlights.add("Internal notes remain limited to assigned staff and admin.");
            highlights.add("Comments and attachments still follow the ticket access rules.");
            actions.add("Open a ticket to see its comment visibility");
        } else if (normalized.contains("edit")) {
            answer =
                    "Reporters can edit only their own OPEN tickets. Once work starts, updates should happen through comments and status changes instead.";
            highlights.add("Only admins can edit any ticket.");
            highlights.add("Open tickets can still be withdrawn by the reporter or admin.");
            actions.add("Check the current ticket status first");
        } else {
            answer =
                    "The ticket assistant can help with status checks, ticket history, duplicate detection, category and priority recommendations, comment drafting, reminders, insights, and report downloads.";
            highlights.add("Use the quick actions to jump into the common ticket flows.");
            highlights.add("Select a ticket first if you want history, explanation, or comment help.");
            actions.add("Try a quick action");
            actions.add("Ask for your ticket insights");
        }

        return buildResponse(
                TicketAssistantIntent.FAQ,
                "Ticketing FAQ",
                answer,
                highlights,
                actions,
                List.of(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null);
    }

    private TicketAssistantResponse handleStatusQuery(
            UserRole membership,
            String message,
            List<TicketSummaryResponse> scopedTickets,
            TicketContext selectedContext) {
        TicketStatus requestedStatus = detectStatus(message);
        boolean wantsList = messageIndicatesList(message);

        if (wantsList && requestedStatus != null) {
            List<TicketSummaryResponse> matchingTickets =
                    scopedTickets.stream()
                            .filter(ticket -> ticket.status() == requestedStatus)
                            .limit(6)
                            .toList();
            return buildResponse(
                    TicketAssistantIntent.STATUS_QUERY,
                    toTitleCase(requestedStatus.name()) + " tickets",
                    "I found "
                            + scopedTickets.stream()
                                    .filter(ticket -> ticket.status() == requestedStatus)
                                    .count()
                            + " "
                            + toTitleCase(requestedStatus.name()).toLowerCase(Locale.ROOT)
                            + " tickets in your current scope.",
                    List.of(
                            "Scope: " + describeScope(membership.getRole().getCode()),
                            "Showing the newest matching tickets below."),
                    List.of("Open one of the matching tickets", "Generate a status-based report"),
                    matchingTickets,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    buildStatusReportSuggestion(membership, requestedStatus, message),
                    "Status-based ticket summary");
        }

        TicketContext context = resolveSingleTicketContext(membership, message, scopedTickets, selectedContext);
        if (context == null) {
            return buildResponse(
                    TicketAssistantIntent.STATUS_QUERY,
                    "Pick a ticket",
                    "Select a ticket or mention a ticket number so I can answer with a precise status.",
                    List.of("Status checks are most accurate when a single ticket is selected."),
                    List.of("Select a ticket", "Ask for open tickets instead"),
                    findRelevantTickets(message, scopedTickets, 4),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null);
        }

        TicketDetailResponse detail = context.detail();
        List<String> highlights = new ArrayList<>();
        highlights.add("Current status: " + toTitleCase(detail.status().name()));
        if (detail.assignedStaffDisplayName() != null) {
            highlights.add("Assigned staff: " + detail.assignedStaffDisplayName());
        }
        if (detail.firstRespondedAt() != null) {
            highlights.add("First response: " + formatDateTime(detail.firstRespondedAt()));
        }
        if (detail.resolvedAt() != null) {
            highlights.add("Resolved: " + formatDateTime(detail.resolvedAt()));
        }

        return buildResponse(
                TicketAssistantIntent.STATUS_QUERY,
                detail.ticketNumber() + " status",
                detail.ticketNumber()
                        + " is currently "
                        + toTitleCase(detail.status().name()).toLowerCase(Locale.ROOT)
                        + ". "
                        + buildStatusExplanation(detail),
                highlights,
                List.of("Summarize the ticket history", "Explain the outcome"),
                List.of(ticketMapper.toSummary(context.ticket())),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null);
    }

    private TicketAssistantResponse handleHistorySummary(
            UserRole membership,
            String message,
            List<TicketSummaryResponse> scopedTickets,
            TicketContext selectedContext) {
        TicketContext context = resolveSingleTicketContext(membership, message, scopedTickets, selectedContext);
        if (context == null) {
            return buildResponse(
                    TicketAssistantIntent.HISTORY_SUMMARY,
                    "Pick a ticket",
                    "Select a ticket or mention a ticket number first so I can summarize the timeline.",
                    List.of("Ticket history needs a single ticket context."),
                    List.of("Select a ticket", "Ask for open-ticket status instead"),
                    findRelevantTickets(message, scopedTickets, 4),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null);
        }

        List<String> timeline = buildTimeline(context);
        return buildResponse(
                TicketAssistantIntent.HISTORY_SUMMARY,
                context.detail().ticketNumber() + " timeline",
                summarizeTimeline(context.detail(), timeline),
                timeline,
                List.of("Explain the outcome", "Draft a follow-up comment"),
                List.of(ticketMapper.toSummary(context.ticket())),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null);
    }

    private TicketAssistantResponse handleDuplicateCheck(
            UserRole membership, String message, TicketContext selectedContext) {
        SourceIssue sourceIssue = extractSourceIssue(message, selectedContext);
        if (sourceIssue == null || sourceIssue.text().isBlank()) {
            return buildResponse(
                    TicketAssistantIntent.DUPLICATE_CHECK,
                    "Describe the issue first",
                    "Tell me the issue, room, or resource so I can check for similar active tickets.",
                    List.of("Duplicate checks work best with a location or resource plus the issue symptom."),
                    List.of("Paste the issue description", "Select a ticket and ask again"),
                    List.of(),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null);
        }

        List<DuplicateCandidate> duplicateCandidates =
                ticketRepository.searchAll(null, null, null, null).stream()
                        .filter(ticket -> ticket.getStatus() == TicketStatus.OPEN || ticket.getStatus() == TicketStatus.IN_PROGRESS)
                        .filter(ticket -> sourceIssue.ticketId() == null || !ticket.getId().equals(sourceIssue.ticketId()))
                        .map(ticket -> new DuplicateCandidate(ticket, scoreDuplicate(sourceIssue, ticket)))
                        .filter(candidate -> candidate.score() >= 35)
                        .sorted(Comparator.comparingInt(DuplicateCandidate::score).reversed())
                        .limit(5)
                        .toList();

        long hiddenMatches =
                duplicateCandidates.stream()
                        .filter(candidate -> !canViewTicket(membership, candidate.ticket()))
                        .count();
        List<TicketSummaryResponse> visibleMatches =
                duplicateCandidates.stream()
                        .filter(candidate -> canViewTicket(membership, candidate.ticket()))
                        .map(DuplicateCandidate::ticket)
                        .map(ticketMapper::toSummary)
                        .toList();

        String messageText;
        List<String> highlights = new ArrayList<>();
        if (duplicateCandidates.isEmpty()) {
            messageText =
                    "I did not find a strong duplicate among active tickets based on the current issue details.";
            highlights.add("You can submit the ticket if the issue still needs attention.");
        } else {
            messageText =
                    "I found "
                            + duplicateCandidates.size()
                            + " similar active ticket"
                            + (duplicateCandidates.size() == 1 ? "" : "s")
                            + ". Review them before submitting a new issue.";
            if (sourceIssue.locationLabel() != null) {
                highlights.add("Location match: " + sourceIssue.locationLabel());
            }
            if (sourceIssue.resourceLabel() != null) {
                highlights.add("Resource match: " + sourceIssue.resourceLabel());
            }
            if (hiddenMatches > 0) {
                highlights.add(
                        hiddenMatches
                                + " additional similar campus ticket"
                                + (hiddenMatches == 1 ? "" : "s")
                                + " exist outside your normal view.");
            }
        }

        return buildResponse(
                TicketAssistantIntent.DUPLICATE_CHECK,
                "Duplicate ticket check",
                messageText,
                highlights,
                duplicateCandidates.isEmpty()
                        ? List.of("Continue with ticket creation", "Ask for category and priority help")
                        : List.of("Open one of the similar tickets", "Refine the issue description"),
                visibleMatches,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null);
    }

    private TicketAssistantResponse handleCreationGuidance(
            TicketAssistantIntent intent,
            UserRole membership,
            String message,
            TicketContext selectedContext) {
        SourceIssue sourceIssue = extractSourceIssue(message, selectedContext);
        String issueText = sourceIssue == null ? message.trim() : sourceIssue.text();
        Recommendation recommendation = recommendIssue(issueText);
        String improvedDescription =
                buildImprovedDescription(issueText, sourceIssue, recommendation, membership.getRole().getCode());
        List<String> highlights = new ArrayList<>(recommendation.reasons());
        detectMissingTicketDetails(sourceIssue, issueText).forEach(item -> highlights.add("Add " + item));

        String title =
                switch (intent) {
                    case CATEGORY_RECOMMENDATION -> "Category recommendation";
                    case PRIORITY_RECOMMENDATION -> "Priority recommendation";
                    default -> "Ticket creation helper";
                };
        String answer =
                "Recommended category: "
                        + recommendation.category().getName()
                        + ". Recommended priority: "
                        + toTitleCase(recommendation.priority().name())
                        + ".";

        return buildResponse(
                intent,
                title,
                answer,
                highlights,
                List.of("Use the improved description", "Run a duplicate check before submitting"),
                List.of(),
                null,
                improvedDescription,
                recommendation.priority(),
                recommendation.category().getId(),
                recommendation.category().getCode(),
                recommendation.category().getName(),
                null,
                null);
    }

    private TicketAssistantResponse handleReminder(
            UserRole membership, List<TicketSummaryResponse> scopedTickets) {
        List<TicketSummaryResponse> activeTickets =
                scopedTickets.stream()
                        .filter(ticket -> ticket.status() == TicketStatus.OPEN || ticket.status() == TicketStatus.IN_PROGRESS)
                        .sorted(Comparator.comparing(TicketSummaryResponse::createdAt))
                        .toList();

        if (activeTickets.isEmpty()) {
            return buildResponse(
                    TicketAssistantIntent.REMINDER,
                    "No active reminders",
                    "You do not have any open or in-progress tickets in your current scope.",
                    List.of("Everything in your scope is resolved, closed, or rejected."),
                    List.of("Check ticket insights", "Generate a summary report"),
                    List.of(),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null);
        }

        TicketSummaryResponse oldest = activeTickets.getFirst();
        List<String> highlights = new ArrayList<>();
        highlights.add(activeTickets.size() + " active tickets need follow-up.");
        highlights.add("Oldest active ticket: " + oldest.ticketNumber() + " from " + formatDateTime(oldest.createdAt()));

        return buildResponse(
                TicketAssistantIntent.REMINDER,
                "Follow-up reminders",
                "You still have "
                        + activeTickets.size()
                        + " active ticket"
                        + (activeTickets.size() == 1 ? "" : "s")
                        + " in "
                        + describeScope(membership.getRole().getCode()).toLowerCase(Locale.ROOT)
                        + ".",
                highlights,
                List.of("Open the oldest active ticket", "Draft a follow-up comment"),
                activeTickets.stream().limit(4).toList(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null);
    }

    private TicketAssistantResponse handleResolutionExplanation(
            UserRole membership,
            String message,
            List<TicketSummaryResponse> scopedTickets,
            TicketContext selectedContext) {
        TicketContext context = resolveSingleTicketContext(membership, message, scopedTickets, selectedContext);
        if (context == null) {
            return buildResponse(
                    TicketAssistantIntent.RESOLUTION_EXPLANATION,
                    "Pick a ticket",
                    "Select a ticket or mention a ticket number so I can explain the outcome.",
                    List.of("Outcome explanations are tied to a single ticket."),
                    List.of("Select a ticket", "Ask for open-ticket status instead"),
                    findRelevantTickets(message, scopedTickets, 4),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null);
        }

        TicketDetailResponse detail = context.detail();
        List<String> highlights = new ArrayList<>();
        String answer;
        if ((detail.status() == TicketStatus.RESOLVED || detail.status() == TicketStatus.CLOSED)
                && detail.resolutionSummary() != null
                && !detail.resolutionSummary().isBlank()) {
            answer =
                    detail.ticketNumber()
                            + " was "
                            + toTitleCase(detail.status().name()).toLowerCase(Locale.ROOT)
                            + " because staff recorded this resolution: "
                            + detail.resolutionSummary().trim();
            highlights.add("Resolved at: " + formatDateTime(detail.resolvedAt()));
            if (detail.closedAt() != null) {
                highlights.add("Closed at: " + formatDateTime(detail.closedAt()));
            }
        } else if (detail.status() == TicketStatus.REJECTED
                && detail.rejectionReason() != null
                && !detail.rejectionReason().isBlank()) {
            answer =
                    detail.ticketNumber()
                            + " was rejected because admin recorded this reason: "
                            + detail.rejectionReason().trim();
            highlights.add("Rejected at: " + formatDateTime(detail.rejectedAt()));
        } else {
            answer =
                    detail.ticketNumber()
                            + " does not have a final resolution or rejection note yet. Its current status is "
                            + toTitleCase(detail.status().name()).toLowerCase(Locale.ROOT)
                            + ".";
        }

        return buildResponse(
                TicketAssistantIntent.RESOLUTION_EXPLANATION,
                detail.ticketNumber() + " outcome",
                answer,
                highlights,
                List.of("Summarize the ticket history", "Draft a follow-up comment"),
                List.of(ticketMapper.toSummary(context.ticket())),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null);
    }

    private TicketAssistantResponse handleCommentAssistant(
            UserRole membership,
            String message,
            List<TicketSummaryResponse> scopedTickets,
            TicketContext selectedContext) {
        TicketContext context = resolveSingleTicketContext(membership, message, scopedTickets, selectedContext);
        if (context == null) {
            return buildResponse(
                    TicketAssistantIntent.COMMENT_ASSISTANT,
                    "Pick a ticket",
                    "Select a ticket first so I can draft a useful follow-up comment.",
                    List.of("Comment suggestions depend on the ticket status and your role."),
                    List.of("Select a ticket", "Ask for unresolved-ticket reminders"),
                    findRelevantTickets(message, scopedTickets, 4),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null);
        }

        String suggestedComment = buildCommentSuggestion(membership, context, message);
        List<String> highlights = new ArrayList<>();
        highlights.add(
                "Draft is tailored to "
                        + toTitleCase(membership.getRole().getCode().name()).toLowerCase(Locale.ROOT)
                        + " actions.");
        highlights.add("Review the wording before posting it publicly.");

        return buildResponse(
                TicketAssistantIntent.COMMENT_ASSISTANT,
                "Comment suggestion",
                "I drafted a follow-up comment for " + context.detail().ticketNumber() + ".",
                highlights,
                List.of("Copy the suggested comment", "Summarize the ticket history"),
                List.of(ticketMapper.toSummary(context.ticket())),
                suggestedComment,
                null,
                null,
                null,
                null,
                null,
                null,
                null);
    }

    private TicketAssistantResponse handleInsights(UserRole membership, List<TicketSummaryResponse> scopedTickets) {
        Map<TicketStatus, Long> statusCounts =
                scopedTickets.stream()
                        .collect(Collectors.groupingBy(TicketSummaryResponse::status, Collectors.counting()));
        Map<String, Long> categoryCounts =
                scopedTickets.stream()
                        .collect(
                                Collectors.groupingBy(
                                        TicketSummaryResponse::ticketCategoryName, Collectors.counting()));

        String topCategory =
                categoryCounts.entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(Map.Entry::getKey)
                        .orElse("No dominant category yet");

        String answer =
                "Your current ticket scope contains "
                        + scopedTickets.size()
                        + " tickets. The most common category is "
                        + topCategory
                        + ".";
        List<String> highlights = new ArrayList<>();
        for (TicketStatus status : TicketStatus.values()) {
            highlights.add(toTitleCase(status.name()) + ": " + statusCounts.getOrDefault(status, 0L));
        }
        highlights.add("Scope: " + describeScope(membership.getRole().getCode()));

        return buildResponse(
                TicketAssistantIntent.INSIGHTS,
                "Ticket insights",
                answer,
                highlights,
                List.of("Generate a summary report", "Open active tickets"),
                scopedTickets.stream().limit(4).toList(),
                null,
                null,
                null,
                null,
                null,
                null,
                buildInsightsReportSuggestion(membership),
                "Last 30 days ticket summary");
    }

    private TicketAssistantResponse handleUnknown(
            UserRole membership,
            List<TicketSummaryResponse> scopedTickets,
            TicketContext selectedContext) {
        List<String> highlights = new ArrayList<>();
        highlights.add("I can check ticket status, summarize history, explain outcomes, and prepare reports.");
        highlights.add("I can also recommend category and priority, detect duplicates, draft comments, and show ticket insights.");
        if (selectedContext != null) {
            highlights.add("Selected ticket: " + selectedContext.detail().ticketNumber());
        }

        return buildResponse(
                TicketAssistantIntent.UNKNOWN,
                "Ticket assistant",
                "Ask me about a ticket, describe a new issue for category and priority help, or request a report download in natural language.",
                highlights,
                List.of("Check the selected ticket status", "Generate a report", "Show my insights"),
                scopedTickets.stream().limit(3).toList(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null);
    }

    private TicketAssistantResponse buildResponse(
            TicketAssistantIntent intent,
            String title,
            String message,
            List<String> highlights,
            List<String> suggestedActions,
            List<TicketSummaryResponse> relatedTickets,
            String suggestedComment,
            String improvedDescription,
            TicketPriority recommendedPriority,
            Long recommendedCategoryId,
            String recommendedCategoryCode,
            String recommendedCategoryName,
            GenerateTicketReportRequest reportSuggestion,
            String reportSuggestionSummary) {
        return new TicketAssistantResponse(
                assistantEnabled(),
                intent,
                title,
                message,
                distinctNonBlank(highlights),
                distinctNonBlank(suggestedActions),
                relatedTickets == null ? List.of() : relatedTickets,
                blankToNull(suggestedComment),
                blankToNull(improvedDescription),
                recommendedPriority,
                recommendedCategoryId,
                blankToNull(recommendedCategoryCode),
                blankToNull(recommendedCategoryName),
                reportSuggestion,
                blankToNull(reportSuggestionSummary));
    }

    private TicketAssistantResponse handleOpenRouterQuery(
            UserRole membership,
            String message,
            List<TicketSummaryResponse> scopedTickets,
            TicketContext selectedContext) {
        if (!assistantEnabled()) {
            return null;
        }

        String completion =
                completeText(
                        """
                        You are the Smart Campus student ticket assistant.
                        You must answer only from the provided ticket data and workflow context.
                        Return valid JSON only. Do not wrap the JSON in markdown.
                        Do not use markdown formatting inside title, message, highlights, suggested actions, suggestedComment, or improvedDescription.
                        Keep message concise and easy to scan: at most two short paragraphs or a very short list.
                        Do not put a full ticket-by-ticket dump inside message when relatedTicketNumbers or highlights can carry that detail.
                        For multi-ticket summaries, message should explain the overall picture and highlights should carry the most useful breakdown.
                        The selected ticket is optional context only. Use it only when the user explicitly refers to "this ticket", "selected ticket", or mentions that ticket number.
                        If the user asks for summaries of current tickets, summarize multiple tickets rather than collapsing to one ticket.
                        Never invent statuses, dates, comments, staff names, categories, resolutions, or rejection reasons.
                        relatedTicketNumbers must contain only ticket numbers that exist in the provided data.
                        recommendedCategoryCode must be one of the provided category codes or null.
                        recommendedPriority must be LOW, MEDIUM, HIGH, URGENT, or null.
                        reportRequestMessage should be a concise natural-language report request only when the user asked for a report, download, export, or PDF.
                        Use this JSON schema exactly:
                        {
                          "intent": "STATUS_QUERY|HISTORY_SUMMARY|FAQ|CREATION_HELP|DUPLICATE_CHECK|PRIORITY_RECOMMENDATION|CATEGORY_RECOMMENDATION|REMINDER|RESOLUTION_EXPLANATION|COMMENT_ASSISTANT|REPORT_HELP|INSIGHTS|UNKNOWN",
                          "title": "short title",
                          "message": "direct answer for the user",
                          "highlights": ["fact 1", "fact 2"],
                          "suggestedActions": ["action 1", "action 2"],
                          "relatedTicketNumbers": ["TCK-..."],
                          "suggestedComment": null,
                          "improvedDescription": null,
                          "recommendedPriority": null,
                          "recommendedCategoryCode": null,
                          "reportRequestMessage": null
                        }
                        """,
                        buildOpenRouterPrompt(membership, message, scopedTickets, selectedContext),
                        950);
        JsonNode payload = parseAssistantJson(completion);
        if (payload == null) {
            return null;
        }

        String answer = sanitizeAssistantText(payload.path("message").asText(null));
        if (answer == null) {
            return null;
        }

        TicketAssistantIntent intent =
                parseAssistantIntent(payload.path("intent").asText(null),
                        resolveIntent(message, selectedContext != null));
        List<String> highlights = parseStringArray(payload.path("highlights"));
        List<String> suggestedActions = parseStringArray(payload.path("suggestedActions"));
        List<TicketSummaryResponse> relatedTickets =
                resolveAssistantRelatedTickets(
                        parseStringArray(payload.path("relatedTicketNumbers")),
                        scopedTickets,
                        message,
                        selectedContext,
                        intent);

        TicketPriority recommendedPriority =
                parseTicketPriority(payload.path("recommendedPriority").asText(null));
        String recommendedCategoryCode =
                blankToNull(payload.path("recommendedCategoryCode").asText(null));
        TicketCategory recommendedCategory =
                recommendedCategoryCode == null
                        ? null
                        : ticketCategoryRepository.findByCodeIgnoreCase(recommendedCategoryCode).orElse(null);

        String suggestedComment = sanitizeAssistantText(payload.path("suggestedComment").asText(null));
        if (suggestedComment == null && intent == TicketAssistantIntent.COMMENT_ASSISTANT) {
            TicketContext context =
                    resolveSingleTicketContext(membership, message, scopedTickets, selectedContext);
            if (context != null) {
                suggestedComment = buildCommentSuggestion(membership, context, message);
            }
        }

        String improvedDescription = sanitizeAssistantText(payload.path("improvedDescription").asText(null));
        if (improvedDescription == null
                && (intent == TicketAssistantIntent.CREATION_HELP
                        || intent == TicketAssistantIntent.CATEGORY_RECOMMENDATION
                        || intent == TicketAssistantIntent.PRIORITY_RECOMMENDATION)) {
            SourceIssue sourceIssue = extractSourceIssue(message, selectedContext);
            String issueText = sourceIssue == null ? message.trim() : sourceIssue.text();
            Recommendation recommendation = recommendIssue(issueText);
            improvedDescription =
                    buildImprovedDescription(
                            issueText, sourceIssue, recommendation, membership.getRole().getCode());
            if (recommendedPriority == null) {
                recommendedPriority = recommendation.priority();
            }
            if (recommendedCategory == null) {
                recommendedCategory = recommendation.category();
                recommendedCategoryCode = recommendation.category().getCode();
            }
        }

        String reportRequestMessage =
                coalesce(
                        blankToNull(payload.path("reportRequestMessage").asText(null)),
                        intent == TicketAssistantIntent.REPORT_HELP ? message : null);
        GenerateTicketReportRequest reportSuggestion = null;
        String reportSuggestionSummary = null;
        if (reportRequestMessage != null) {
            TicketReportAssistantResponse reportResponse =
                    ticketReportAssistantService.interpret(
                            new TicketReportAssistantInterpretRequest(reportRequestMessage));
            reportSuggestion = reportResponse.interpretedRequest();
            reportSuggestionSummary =
                    coalesce(
                            reportResponse.clarificationQuestion(),
                            reportResponse.interpretationSummary(),
                            "Report request interpreted.");
        }

        return buildResponse(
                intent,
                coalesce(sanitizeAssistantText(payload.path("title").asText(null)), "Ticket assistant"),
                answer,
                highlights,
                suggestedActions,
                relatedTickets,
                suggestedComment,
                improvedDescription,
                recommendedPriority,
                recommendedCategory == null ? null : recommendedCategory.getId(),
                recommendedCategoryCode,
                recommendedCategory == null ? null : recommendedCategory.getName(),
                reportSuggestion,
                reportSuggestionSummary);
    }

    private String buildOpenRouterPrompt(
            UserRole membership,
            String message,
            List<TicketSummaryResponse> scopedTickets,
            TicketContext selectedContext) {
        StringBuilder builder = new StringBuilder();
        builder.append("Current date: ").append(LocalDate.now()).append('\n');
        builder.append("Role: ").append(membership.getRole().getCode().name()).append('\n');
        builder.append("Scope: ").append(describeScope(membership.getRole().getCode())).append('\n');
        builder.append("User request: ").append(message).append("\n\n");
        builder.append("Ticket counts by status: ");
        builder.append(
                Arrays.stream(TicketStatus.values())
                        .map(
                                status ->
                                        status.name()
                                                + "="
                                                + scopedTickets.stream()
                                                        .filter(ticket -> ticket.status() == status)
                                                        .count())
                        .collect(Collectors.joining(", ")));
        builder.append("\n\nAvailable categories:\n");
        ticketCategoryRepository.findAll().stream()
                .sorted(Comparator.comparing(TicketCategory::getName, String.CASE_INSENSITIVE_ORDER))
                .forEach(
                        category ->
                                builder.append("- ")
                                        .append(category.getCode())
                                        .append(" | ")
                                        .append(category.getName())
                                        .append('\n'));

        if (selectedContext != null) {
            builder.append("\nSelected ticket context (use only if the user clearly refers to it):\n");
            builder.append(buildSelectedTicketDigest(selectedContext));
        }

        builder.append("\nAll current tickets in scope:\n");
        if (scopedTickets.isEmpty()) {
            builder.append("- No tickets are currently in scope.\n");
        } else {
            scopedTickets.stream()
                    .sorted(Comparator.comparing(TicketSummaryResponse::updatedAt).reversed())
                    .forEach(ticket -> builder.append("- ").append(buildTicketDigest(ticket)).append('\n'));
        }

        return builder.toString();
    }

    private String buildSelectedTicketDigest(TicketContext selectedContext) {
        TicketDetailResponse detail = selectedContext.detail();
        StringBuilder builder = new StringBuilder();
        builder.append("Ticket number: ").append(detail.ticketNumber()).append('\n');
        builder.append("Title: ").append(detail.title()).append('\n');
        builder.append("Status: ").append(detail.status().name()).append('\n');
        builder.append("Priority: ").append(detail.priority().name()).append('\n');
        builder.append("Category: ").append(detail.ticketCategoryCode()).append(" | ")
                .append(detail.ticketCategoryName()).append('\n');
        builder.append("Reporter: ").append(detail.reporterDisplayName()).append('\n');
        builder.append("Assigned staff: ").append(safeAssistantValue(detail.assignedStaffDisplayName())).append('\n');
        builder.append("Location: ").append(resolveDetailScope(detail)).append('\n');
        builder.append("Resource: ").append(safeAssistantValue(detail.resourceName())).append('\n');
        builder.append("Description: ").append(detail.description()).append('\n');
        builder.append("Resolution summary: ").append(safeAssistantValue(detail.resolutionSummary())).append('\n');
        builder.append("Rejection reason: ").append(safeAssistantValue(detail.rejectionReason())).append('\n');
        builder.append("Created: ").append(formatDateTime(detail.createdAt())).append('\n');
        builder.append("Updated: ").append(formatDateTime(detail.updatedAt())).append('\n');
        builder.append("First response: ").append(formatDateTime(detail.firstRespondedAt())).append('\n');
        builder.append("Resolved: ").append(formatDateTime(detail.resolvedAt())).append('\n');
        builder.append("Closed: ").append(formatDateTime(detail.closedAt())).append('\n');
        List<String> timeline = buildTimeline(selectedContext);
        if (!timeline.isEmpty()) {
            builder.append("Timeline: ").append(String.join(" || ", timeline)).append('\n');
        }
        return builder.toString();
    }

    private String buildTicketDigest(TicketSummaryResponse ticket) {
        return String.join(
                " | ",
                List.of(
                        ticket.ticketNumber(),
                        "title=" + ticket.title(),
                        "status=" + ticket.status().name(),
                        "priority=" + ticket.priority().name(),
                        "category=" + ticket.ticketCategoryName(),
                        "scope=" + resolveSummaryScope(ticket),
                        "reporter=" + ticket.reporterDisplayName(),
                        "assignee=" + safeAssistantValue(ticket.assignedStaffDisplayName()),
                        "created=" + formatDateTime(ticket.createdAt()),
                        "updated=" + formatDateTime(ticket.updatedAt()),
                        "firstResponse=" + formatDateTime(ticket.firstRespondedAt()),
                        "resolved=" + formatDateTime(ticket.resolvedAt())));
    }

    private JsonNode parseAssistantJson(String completion) {
        String payload = blankToNull(completion);
        if (payload == null) {
            return null;
        }

        String cleaned = payload.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```(?:json)?", "").replaceFirst("```$", "").trim();
        }
        int objectStart = cleaned.indexOf('{');
        int objectEnd = cleaned.lastIndexOf('}');
        if (objectStart >= 0 && objectEnd > objectStart) {
            cleaned = cleaned.substring(objectStart, objectEnd + 1);
        }

        try {
            return OBJECT_MAPPER.readTree(cleaned);
        } catch (Exception ex) {
            log.warn("Ticket assistant JSON parsing failed for OpenRouter response: {}", cleaned, ex);
            return null;
        }
    }

    private List<String> parseStringArray(JsonNode node) {
        if (node == null || !node.isArray()) {
            return List.of();
        }
        List<String> values = new ArrayList<>();
        node.forEach(entry -> {
            if (entry.isTextual()) {
                String value = sanitizeAssistantText(entry.asText());
                if (value != null) {
                    values.add(value);
                }
            }
        });
        return values;
    }

    private TicketAssistantIntent parseAssistantIntent(String value, TicketAssistantIntent fallback) {
        String normalized = blankToNull(value);
        if (normalized == null) {
            return fallback;
        }
        String compact = normalizeText(normalized).replace(' ', '_');
        try {
            return TicketAssistantIntent.valueOf(compact.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            if (compact.contains("report") || compact.contains("download") || compact.contains("export")) {
                return TicketAssistantIntent.REPORT_HELP;
            }
            if (compact.contains("faq") || compact.contains("question") || compact.contains("help")) {
                return TicketAssistantIntent.FAQ;
            }
            if (compact.contains("timeline") || compact.contains("history")) {
                return TicketAssistantIntent.HISTORY_SUMMARY;
            }
            if (compact.contains("duplicate")) {
                return TicketAssistantIntent.DUPLICATE_CHECK;
            }
            if (compact.contains("comment") || compact.contains("reply")) {
                return TicketAssistantIntent.COMMENT_ASSISTANT;
            }
            if (compact.contains("outcome") || compact.contains("resolution") || compact.contains("rejection")) {
                return TicketAssistantIntent.RESOLUTION_EXPLANATION;
            }
            if (compact.contains("priority")) {
                return TicketAssistantIntent.PRIORITY_RECOMMENDATION;
            }
            if (compact.contains("category")) {
                return TicketAssistantIntent.CATEGORY_RECOMMENDATION;
            }
            if (compact.contains("create") || compact.contains("description") || compact.contains("draft")) {
                return TicketAssistantIntent.CREATION_HELP;
            }
            if (compact.contains("reminder") || compact.contains("follow")) {
                return TicketAssistantIntent.REMINDER;
            }
            if (compact.contains("summary")
                    || compact.contains("insight")
                    || compact.contains("overview")
                    || compact.contains("multi_ticket")) {
                return TicketAssistantIntent.INSIGHTS;
            }
            if (compact.contains("status")) {
                return TicketAssistantIntent.STATUS_QUERY;
            }
            return fallback;
        }
    }

    private TicketPriority parseTicketPriority(String value) {
        String normalized = blankToNull(value);
        if (normalized == null || "null".equalsIgnoreCase(normalized)) {
            return null;
        }
        try {
            return TicketPriority.valueOf(normalized.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private List<TicketSummaryResponse> resolveAssistantRelatedTickets(
            List<String> relatedTicketNumbers,
            List<TicketSummaryResponse> scopedTickets,
            String message,
            TicketContext selectedContext,
            TicketAssistantIntent intent) {
        LinkedHashMap<Long, TicketSummaryResponse> resolved = new LinkedHashMap<>();

        Set<String> explicitTicketNumbers =
                relatedTicketNumbers.stream()
                        .map(number -> number.toUpperCase(Locale.ROOT))
                        .collect(Collectors.toCollection(LinkedHashSet::new));
        List<String> ticketNumberSources = new ArrayList<>();
        ticketNumberSources.add(message);
        ticketNumberSources.add(String.join(" ", relatedTicketNumbers));
        if (selectedContext != null) {
            ticketNumberSources.add(selectedContext.detail().ticketNumber());
        }
        explicitTicketNumbers.addAll(extractMentionedTicketNumbers(ticketNumberSources));

        for (String ticketNumber : explicitTicketNumbers) {
            scopedTickets.stream()
                    .filter(ticket -> ticket.ticketNumber().equalsIgnoreCase(ticketNumber))
                    .findFirst()
                    .ifPresent(ticket -> resolved.put(ticket.id(), ticket));
        }

        if (resolved.isEmpty() && selectedContext != null
                && (containsAny(normalizeText(message), "this ticket", "selected ticket")
                        || normalizeText(message)
                                .contains(selectedContext.detail().ticketNumber().toLowerCase(Locale.ROOT)))) {
            resolved.put(selectedContext.ticket().getId(), ticketMapper.toSummary(selectedContext.ticket()));
        }

        if (resolved.isEmpty()) {
            if (messageIndicatesList(message)
                    || intent == TicketAssistantIntent.INSIGHTS
                    || intent == TicketAssistantIntent.REMINDER
                    || containsAny(normalizeText(message), "summary", "summaries", "current tickets")) {
                scopedTickets.stream()
                        .sorted(Comparator.comparing(TicketSummaryResponse::updatedAt).reversed())
                        .limit(8)
                        .forEach(ticket -> resolved.put(ticket.id(), ticket));
            } else {
                findRelevantTickets(message, scopedTickets, 6)
                        .forEach(ticket -> resolved.put(ticket.id(), ticket));
            }
        }

        return resolved.values().stream().limit(8).toList();
    }

    private Set<String> extractMentionedTicketNumbers(Collection<String> values) {
        Set<String> ticketNumbers = new LinkedHashSet<>();
        if (values == null) {
            return ticketNumbers;
        }
        for (String value : values) {
            if (value == null) {
                continue;
            }
            Matcher matcher = TICKET_NUMBER_PATTERN.matcher(value);
            while (matcher.find()) {
                ticketNumbers.add(matcher.group().toUpperCase(Locale.ROOT));
            }
        }
        return ticketNumbers;
    }

    private String resolveSummaryScope(TicketSummaryResponse ticket) {
        if (ticket.resourceName() != null && ticket.locationName() != null) {
            return ticket.resourceName() + " / " + ticket.locationName();
        }
        if (ticket.resourceName() != null) {
            return ticket.resourceName();
        }
        if (ticket.locationName() != null) {
            return ticket.locationName();
        }
        return "Not provided";
    }

    private String resolveDetailScope(TicketDetailResponse detail) {
        List<String> parts = new ArrayList<>();
        if (detail.locationName() != null) {
            parts.add(detail.locationName());
        }
        if (detail.locationBuilding() != null) {
            parts.add("Building " + detail.locationBuilding());
        }
        if (detail.locationFloor() != null) {
            parts.add("Floor " + detail.locationFloor());
        }
        if (detail.locationRoomIdentifier() != null) {
            parts.add("Room " + detail.locationRoomIdentifier());
        }
        if (parts.isEmpty()) {
            return "Not provided";
        }
        return String.join(" / ", parts);
    }

    private String safeAssistantValue(String value) {
        return value == null || value.isBlank() ? "Not provided" : value.trim();
    }

    private TicketAssistantIntent resolveIntent(String message, boolean hasSelectedTicket) {
        String normalized = normalizeText(message);
        if (containsAny(normalized, "report", "download", "export", "pdf", "csv")) {
            return TicketAssistantIntent.REPORT_HELP;
        }
        if (containsAny(normalized, "how many images", "how do i", "what does", "who can", "can i edit")) {
            return TicketAssistantIntent.FAQ;
        }
        if (containsAny(normalized, "insight", "how many tickets", "what type of issues", "ticket stats")) {
            return TicketAssistantIntent.INSIGHTS;
        }
        if (containsAny(normalized, "remind", "reminder", "unresolved", "follow up", "still have")) {
            return TicketAssistantIntent.REMINDER;
        }
        if (containsAny(normalized, "duplicate", "similar ticket", "already exists")) {
            return TicketAssistantIntent.DUPLICATE_CHECK;
        }
        if (containsAny(normalized, "comment", "reply", "confirm fix")) {
            return TicketAssistantIntent.COMMENT_ASSISTANT;
        }
        if (containsAny(normalized, "history", "timeline", "progress")) {
            return TicketAssistantIntent.HISTORY_SUMMARY;
        }
        if (containsAny(normalized, "why rejected", "why resolved", "explain rejection", "explain resolution")) {
            return TicketAssistantIntent.RESOLUTION_EXPLANATION;
        }
        if (normalized.contains("category") && !normalized.contains("report")) {
            return TicketAssistantIntent.CATEGORY_RECOMMENDATION;
        }
        if (normalized.contains("priority")) {
            return TicketAssistantIntent.PRIORITY_RECOMMENDATION;
        }
        if (containsAny(normalized, "help me write", "improve", "draft ticket", "ticket description")) {
            return TicketAssistantIntent.CREATION_HELP;
        }
        if (containsAny(normalized, "status", "open", "resolved", "closed", "rejected", "in progress")) {
            return TicketAssistantIntent.STATUS_QUERY;
        }
        if (hasSelectedTicket) {
            return TicketAssistantIntent.STATUS_QUERY;
        }
        if (normalized.endsWith("?")) {
            return TicketAssistantIntent.FAQ;
        }
        return TicketAssistantIntent.CREATION_HELP;
    }

    private TicketContext resolveSelectedContext(UserRole membership, Long selectedTicketId) {
        if (selectedTicketId == null) {
            return null;
        }

        Ticket ticket = ticketService.getDetailedTicketEntity(selectedTicketId);
        ticketAccessService.ensureCanViewTicket(membership, ticket);
        return new TicketContext(ticket, ticketService.getTicketById(selectedTicketId));
    }

    private TicketContext resolveSingleTicketContext(
            UserRole membership,
            String message,
            List<TicketSummaryResponse> scopedTickets,
            TicketContext selectedContext) {
        String explicitTicketNumber = extractTicketNumber(message);
        if (explicitTicketNumber != null) {
            TicketSummaryResponse summary =
                    scopedTickets.stream()
                            .filter(ticket -> ticket.ticketNumber().equalsIgnoreCase(explicitTicketNumber))
                            .findFirst()
                            .orElse(null);
            if (summary == null) {
                return null;
            }
            Ticket ticket = ticketService.getDetailedTicketEntity(summary.id());
            ticketAccessService.ensureCanViewTicket(membership, ticket);
            return new TicketContext(ticket, ticketService.getTicketById(summary.id()));
        }

        if (selectedContext != null) {
            return selectedContext;
        }

        List<TicketSummaryResponse> rankedTickets = findRelevantTickets(message, scopedTickets, 2);
        if (rankedTickets.size() == 1) {
            TicketSummaryResponse summary = rankedTickets.getFirst();
            Ticket ticket = ticketService.getDetailedTicketEntity(summary.id());
            ticketAccessService.ensureCanViewTicket(membership, ticket);
            return new TicketContext(ticket, ticketService.getTicketById(summary.id()));
        }

        return null;
    }

    private List<TicketSummaryResponse> findRelevantTickets(
            String message, List<TicketSummaryResponse> scopedTickets, int limit) {
        Set<String> tokens = tokenizeForSearch(message);
        String explicitTicketNumber = extractTicketNumber(message);
        if (explicitTicketNumber != null) {
            return scopedTickets.stream()
                    .filter(ticket -> ticket.ticketNumber().equalsIgnoreCase(explicitTicketNumber))
                    .limit(limit)
                    .toList();
        }
        if (tokens.isEmpty()) {
            return List.of();
        }

        return scopedTickets.stream()
                .map(ticket -> new ScoredTicket(ticket, scoreTicket(tokens, ticket)))
                .filter(scored -> scored.score() > 0)
                .sorted(Comparator.comparingInt(ScoredTicket::score).reversed())
                .limit(limit)
                .map(ScoredTicket::ticket)
                .toList();
    }

    private int scoreTicket(Set<String> tokens, TicketSummaryResponse ticket) {
        int score = 0;
        String haystack =
                normalizeText(
                        String.join(
                                " ",
                                List.of(
                                        ticket.ticketNumber(),
                                        ticket.title(),
                                        nullToEmpty(ticket.ticketCategoryName()),
                                        nullToEmpty(ticket.resourceName()),
                                        nullToEmpty(ticket.locationName()),
                                        ticket.status().name(),
                                        ticket.priority().name())));
        for (String token : tokens) {
            if (haystack.contains(token)) {
                score += 6;
            }
            if (normalizeText(ticket.title()).contains(token)) {
                score += 4;
            }
            if (normalizeText(ticket.ticketCategoryName()).contains(token)) {
                score += 3;
            }
            if (normalizeText(ticket.locationName()).contains(token)
                    || normalizeText(ticket.resourceName()).contains(token)) {
                score += 5;
            }
        }
        return score;
    }

    private List<String> buildTimeline(TicketContext context) {
        TicketDetailResponse detail = context.detail();
        List<TicketCommentResponse> comments = ticketCommentService.getComments(context.ticket());
        List<TimelineEvent> events = new ArrayList<>();
        events.add(new TimelineEvent(detail.createdAt(), "Ticket created"));
        if (detail.firstRespondedAt() != null) {
            events.add(new TimelineEvent(detail.firstRespondedAt(), "First staff response recorded"));
        }
        detail.assignmentHistory().stream()
                .sorted(Comparator.comparing(assignment -> assignment.assignedAt()))
                .forEach(
                        assignment ->
                                events.add(
                                        new TimelineEvent(
                                                assignment.assignedAt(),
                                                "Assigned to " + assignment.assignedToDisplayName())));
        comments.stream()
                .filter(comment -> comment.commentType() == CommentType.STATUS_NOTE)
                .forEach(comment -> events.add(new TimelineEvent(comment.createdAt(), comment.body())));
        if (detail.resolvedAt() != null) {
            events.add(new TimelineEvent(detail.resolvedAt(), "Marked resolved"));
        }
        if (detail.rejectedAt() != null) {
            events.add(new TimelineEvent(detail.rejectedAt(), "Rejected by admin"));
        }
        if (detail.closedAt() != null) {
            events.add(new TimelineEvent(detail.closedAt(), "Closed by admin"));
        }

        return events.stream()
                .filter(event -> event.at() != null)
                .sorted(Comparator.comparing(TimelineEvent::at))
                .map(event -> formatDateTime(event.at()) + " | " + event.label())
                .distinct()
                .limit(8)
                .toList();
    }

    private String summarizeTimeline(TicketDetailResponse detail, List<String> timeline) {
        if (timeline.isEmpty()) {
            return detail.ticketNumber() + " has no detailed timeline events yet.";
        }
        if (timeline.size() == 1) {
            return detail.ticketNumber() + " currently has one recorded milestone: " + timeline.getFirst() + ".";
        }
        return detail.ticketNumber()
                + " moved through "
                + timeline.size()
                + " recorded milestones, starting with "
                + timeline.getFirst()
                + " and most recently "
                + timeline.getLast()
                + ".";
    }

    private SourceIssue extractSourceIssue(String message, TicketContext selectedContext) {
        String normalizedMessage = normalizeText(message);
        if (selectedContext != null
                && (containsAny(normalizedMessage, "selected ticket", "this ticket")
                        || normalizedMessage.contains(
                                selectedContext.detail().ticketNumber().toLowerCase(Locale.ROOT)))) {
            return new SourceIssue(
                    selectedContext.ticket().getId(),
                    selectedContext.detail().title() + ". " + selectedContext.detail().description(),
                    selectedContext.detail().locationName(),
                    selectedContext.detail().resourceName(),
                    selectedContext.detail().ticketCategoryId(),
                    selectedContext.detail().locationId(),
                    selectedContext.detail().resourceId());
        }

        int separatorIndex = message.indexOf(':');
        String extracted =
                separatorIndex >= 0 && separatorIndex < message.length() - 1
                        ? message.substring(separatorIndex + 1).trim()
                        : message.trim();
        if (extracted.isBlank()) {
            return null;
        }

        return new SourceIssue(null, extracted, null, null, null, null, null);
    }

    private Recommendation recommendIssue(String issueText) {
        String normalized = normalizeText(issueText);
        Map<String, Integer> categoryScores = new HashMap<>();
        categoryScores.put(
                "ELECTRICAL",
                scoreKeywords(
                        normalized,
                        "power",
                        "lighting",
                        "light",
                        "wire",
                        "wiring",
                        "switch",
                        "socket",
                        "outlet",
                        "electrical"));
        categoryScores.put(
                "IT_NETWORK",
                scoreKeywords(
                        normalized,
                        "wifi",
                        "wi fi",
                        "internet",
                        "network",
                        "lan",
                        "ethernet",
                        "computer",
                        "pc",
                        "printer"));
        categoryScores.put(
                "AV_EQUIPMENT",
                scoreKeywords(
                        normalized,
                        "projector",
                        "display",
                        "screen",
                        "microphone",
                        "speaker",
                        "audio",
                        "av",
                        "smart board"));
        categoryScores.put(
                "FURNITURE_INTERIOR",
                scoreKeywords(normalized, "chair", "desk", "table", "cabinet", "furniture"));
        categoryScores.put(
                "HVAC_ENVIRONMENT",
                scoreKeywords(
                        normalized,
                        "ac",
                        "air conditioning",
                        "aircon",
                        "ventilation",
                        "temperature",
                        "cooling"));
        categoryScores.put(
                "PLUMBING_SANITATION",
                scoreKeywords(
                        normalized,
                        "washroom",
                        "toilet",
                        "sink",
                        "tap",
                        "drain",
                        "water leak",
                        "plumbing",
                        "sanitation"));
        categoryScores.put(
                "CLEANING_HOUSEKEEPING",
                scoreKeywords(
                        normalized, "cleaning", "garbage", "trash", "spill", "dirty", "housekeeping"));
        categoryScores.put(
                "SAFETY_SECURITY",
                scoreKeywords(
                        normalized,
                        "hazard",
                        "unsafe",
                        "security",
                        "fire",
                        "smoke",
                        "exposed wire",
                        "danger"));
        categoryScores.put(
                "FACILITY_DAMAGE",
                scoreKeywords(normalized, "door", "window", "wall", "floor", "ceiling", "damage", "crack"));
        categoryScores.put("OTHER", 1);

        String categoryCode =
                categoryScores.entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(Map.Entry::getKey)
                        .orElse("OTHER");

        TicketCategory category =
                ticketCategoryRepository
                        .findByCodeIgnoreCase(categoryCode)
                        .orElseGet(
                                () ->
                                        ticketCategoryRepository.findAll().stream()
                                                .findFirst()
                                                .orElseThrow(
                                                        () ->
                                                                new IllegalStateException(
                                                                        "No ticket categories are configured")));

        TicketPriority priority = recommendPriority(normalized);
        List<String> reasons = new ArrayList<>();
        reasons.add("Category fit: " + category.getName());
        reasons.add("Priority fit: " + toTitleCase(priority.name()));
        if (priority == TicketPriority.URGENT || priority == TicketPriority.HIGH) {
            reasons.add("The wording suggests a high-impact or safety-related issue.");
        }
        return new Recommendation(category, priority, reasons);
    }

    private TicketPriority recommendPriority(String normalizedIssueText) {
        if (containsAny(
                normalizedIssueText,
                "fire",
                "smoke",
                "exposed wire",
                "electric shock",
                "flood",
                "hazard",
                "unsafe",
                "security breach")) {
            return TicketPriority.URGENT;
        }
        if (containsAny(
                        normalizedIssueText,
                        "no internet",
                        "wifi down",
                        "network down",
                        "not working during class",
                        "whole lab",
                        "entire lab",
                        "water leak",
                        "cannot use")
                || (containsAny(normalizedIssueText, "projector", "computer", "ac")
                        && containsAny(normalizedIssueText, "lab", "class", "lecture"))) {
            return TicketPriority.HIGH;
        }
        if (containsAny(
                normalizedIssueText,
                "projector",
                "computer",
                "lighting",
                "washroom",
                "network",
                "ac",
                "air conditioning",
                "plumbing")) {
            return TicketPriority.MEDIUM;
        }
        return TicketPriority.LOW;
    }

    private List<String> detectMissingTicketDetails(SourceIssue sourceIssue, String issueText) {
        List<String> missingFields = new ArrayList<>();
        String normalized = normalizeText(issueText);
        if (sourceIssue == null || (sourceIssue.locationId() == null && sourceIssue.resourceId() == null)) {
            if (!containsAny(normalized, "room", "lab", "building", "projector", "computer", "washroom", "hall")) {
                missingFields.add("the exact room, lab, or resource");
            }
        }
        if (!containsAny(normalized, "when", "since", "today", "now", "this morning", "this afternoon")) {
            missingFields.add("when the issue started");
        }
        if (!containsAny(normalized, "cannot", "unable", "fails", "error", "screen", "leak", "broken")) {
            missingFields.add("the visible symptom or error");
        }
        if (!containsAny(normalized, "affect", "impact", "class", "lab", "students", "staff", "use")) {
            missingFields.add("who or what is affected");
        }
        return missingFields;
    }

    private String buildImprovedDescription(
            String issueText, SourceIssue sourceIssue, Recommendation recommendation, RoleCode roleCode) {
        String fallback =
                "Issue summary: "
                        + issueText.trim()
                        + System.lineSeparator()
                        + System.lineSeparator()
                        + "Suggested category: "
                        + recommendation.category().getName()
                        + System.lineSeparator()
                        + "Suggested priority: "
                        + toTitleCase(recommendation.priority().name())
                        + System.lineSeparator()
                        + "Please include the exact room or resource, the visible symptom, when it started, and the operational impact.";

        if (!assistantEnabled()) {
            return fallback;
        }

        String prompt =
                "Role: "
                        + roleCode.name()
                        + "\nIssue text: "
                        + issueText
                        + "\nSuggested category: "
                        + recommendation.category().getName()
                        + "\nSuggested priority: "
                        + recommendation.priority().name()
                        + (sourceIssue != null && sourceIssue.locationLabel() != null
                                ? "\nKnown location: " + sourceIssue.locationLabel()
                                : "")
                        + (sourceIssue != null && sourceIssue.resourceLabel() != null
                                ? "\nKnown resource: " + sourceIssue.resourceLabel()
                                : "");
        String completion =
                completeText(
                        """
                        You improve short maintenance and incident ticket descriptions for a campus ticketing system.
                        Return plain text only.
                        Keep the description concise, factual, and ready to paste into a ticket form.
                        Do not invent facts. If details are missing, mention them as short placeholders the user can fill in.
                        """,
                        prompt,
                        220);
        return blankToNull(completion) != null ? completion.trim() : fallback;
    }

    private String buildPolishedFormDescription(String title, String description) {
        String fallback = description.trim().replaceAll("[ \\t]+", " ");

        if (!assistantEnabled()) {
            return fallback;
        }

        String prompt =
                "Ticket title (context only): "
                        + nullToEmpty(title)
                        + "\nUser description: "
                        + description;
        String completion =
                completeText(
                        """
                        You rewrite ticket descriptions for a campus maintenance form.
                        Return plain text only.
                        Only correct grammar, punctuation, spelling, and sentence flow.
                        Keep the original meaning and scope exactly the same.
                        Do not add category names, priority labels, room-number placeholders, headings, bullet numbers, or checklists.
                        Do not ask for more details.
                        Do not add facts that the user did not mention.
                        Output only the refined description text.
                        """,
                        prompt,
                        180);
        return blankToNull(completion) != null ? completion.trim() : fallback;
    }

    private String buildCommentSuggestion(UserRole membership, TicketContext context, String message) {
        TicketDetailResponse detail = context.detail();
        String fallback =
                switch (membership.getRole().getCode()) {
                    case STUDENT -> switch (detail.status()) {
                        case RESOLVED, CLOSED ->
                                "I checked the issue again and the fix works on my side. Thank you for the update.";
                        case OPEN, IN_PROGRESS ->
                                "The issue is still affecting this location. The current impact is [add impact here]. Please share the next update when available.";
                        case REJECTED ->
                                "I understand the rejection reason. Please let me know if I should submit a new ticket with more details.";
                    };
                    case STAFF -> switch (detail.status()) {
                        case OPEN, IN_PROGRESS ->
                                "Work is in progress. Current action: [add action]. Expected next update: [add time].";
                        case RESOLVED ->
                                "Resolution confirmed. The issue was fixed by [add action], and the location is ready for use again.";
                        case CLOSED ->
                                "Final closure review completed.";
                        case REJECTED ->
                                "Rejected after review. See the admin note for the final reason.";
                    };
                    case ADMIN -> switch (detail.status()) {
                        case RESOLVED ->
                                "Resolution reviewed and ready for closure confirmation.";
                        case REJECTED ->
                                "Ticket rejected after review because [add concise reason].";
                        case CLOSED ->
                                "Ticket closed after confirming the recorded resolution.";
                        case OPEN, IN_PROGRESS ->
                                "Admin review note: assignment and workflow are being monitored.";
                    };
                };

        if (!assistantEnabled()) {
            return fallback;
        }

        String prompt =
                "Role: "
                        + membership.getRole().getCode().name()
                        + "\nTicket number: "
                        + detail.ticketNumber()
                        + "\nTicket title: "
                        + detail.title()
                        + "\nTicket status: "
                        + detail.status().name()
                        + "\nResolution summary: "
                        + nullToEmpty(detail.resolutionSummary())
                        + "\nRejection reason: "
                        + nullToEmpty(detail.rejectionReason())
                        + "\nUser request: "
                        + message;
        String completion =
                completeText(
                        """
                        You draft short, useful ticket comments for a campus maintenance workflow.
                        Return plain text only.
                        Keep the draft under 55 words.
                        Do not invent technical fixes or timeline facts that were not provided.
                        """,
                        prompt,
                        140);
        return blankToNull(completion) != null ? completion.trim() : fallback;
    }

    private String buildStatusExplanation(TicketDetailResponse detail) {
        return switch (detail.status()) {
            case OPEN ->
                    detail.assignedStaffUserId() == null
                            ? "It is waiting for staff assignment."
                            : "It is assigned and waiting for the first staff update.";
            case IN_PROGRESS -> "Staff work is underway.";
            case RESOLVED -> "Staff marked the work complete and admin can now close it.";
            case CLOSED -> "The workflow is complete.";
            case REJECTED -> "Admin rejected the request.";
        };
    }

    private GenerateTicketReportRequest buildStatusReportSuggestion(
            UserRole membership, TicketStatus requestedStatus, String message) {
        return new GenerateTicketReportRequest(
                null,
                null,
                com.smartcampus.backend.common.enums.TicketReportType.SUMMARY,
                com.smartcampus.backend.common.enums.TicketReportFormat.PDF,
                requestedStatus,
                null,
                null,
                null,
                null,
                membership.getRole().getCode() == RoleCode.STAFF ? membership.getUser().getId() : null,
                membership.getRole().getCode() == RoleCode.STUDENT ? membership.getUser().getId() : null,
                null,
                null,
                message);
    }

    private GenerateTicketReportRequest buildInsightsReportSuggestion(UserRole membership) {
        return new GenerateTicketReportRequest(
                null,
                null,
                com.smartcampus.backend.common.enums.TicketReportType.SUMMARY,
                com.smartcampus.backend.common.enums.TicketReportFormat.PDF,
                null,
                null,
                null,
                null,
                null,
                membership.getRole().getCode() == RoleCode.STAFF ? membership.getUser().getId() : null,
                membership.getRole().getCode() == RoleCode.STUDENT ? membership.getUser().getId() : null,
                LocalDate.now().minusDays(30),
                LocalDate.now(),
                "Generate a summary of my ticket insights");
    }

    private TicketStatus detectStatus(String message) {
        String normalized = normalizeText(message);
        if (normalized.contains("in progress") || normalized.contains("working on")) {
            return TicketStatus.IN_PROGRESS;
        }
        if (normalized.contains("resolved") || normalized.contains("fixed")) {
            return TicketStatus.RESOLVED;
        }
        if (normalized.contains("closed")) {
            return TicketStatus.CLOSED;
        }
        if (normalized.contains("rejected")) {
            return TicketStatus.REJECTED;
        }
        if (normalized.contains("open")) {
            return TicketStatus.OPEN;
        }
        return null;
    }

    private boolean messageIndicatesList(String message) {
        String normalized = normalizeText(message);
        return containsAny(normalized, "which", "list", "show my", "all my", "tickets are");
    }

    private boolean containsAny(String text, String... probes) {
        String normalizedText = normalizeText(text);
        return Arrays.stream(probes).anyMatch(probe -> normalizedText.contains(normalizeText(probe)));
    }

    private String extractTicketNumber(String message) {
        Matcher matcher = TICKET_NUMBER_PATTERN.matcher(message);
        return matcher.find() ? matcher.group().toUpperCase(Locale.ROOT) : null;
    }

    private Set<String> tokenizeForSearch(String message) {
        return Arrays.stream(normalizeText(message).split("\\s+"))
                .map(String::trim)
                .filter(token -> token.length() > 2)
                .filter(token -> !STOP_WORDS.contains(token))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private int scoreDuplicate(SourceIssue sourceIssue, Ticket candidate) {
        int score = 0;
        if (sourceIssue.resourceId() != null
                && candidate.getResource() != null
                && sourceIssue.resourceId().equals(candidate.getResource().getId())) {
            score += 60;
        }
        if (sourceIssue.locationId() != null
                && candidate.getLocation() != null
                && sourceIssue.locationId().equals(candidate.getLocation().getId())) {
            score += 25;
        }
        if (sourceIssue.categoryId() != null
                && candidate.getTicketCategory() != null
                && sourceIssue.categoryId().equals(candidate.getTicketCategory().getId())) {
            score += 15;
        }
        Set<String> sourceTokens = tokenizeForSearch(sourceIssue.text());
        Set<String> candidateTokens =
                tokenizeForSearch(candidate.getTitle() + " " + nullToEmpty(candidate.getDescription()));
        for (String token : sourceTokens) {
            if (candidateTokens.contains(token)) {
                score += 6;
            }
        }
        return score;
    }

    private boolean canViewTicket(UserRole membership, Ticket ticket) {
        try {
            ticketAccessService.ensureCanViewTicket(membership, ticket);
            return true;
        } catch (AccessDeniedException ex) {
            return false;
        }
    }

    private int scoreKeywords(String normalized, String... keywords) {
        int score = 0;
        for (String keyword : keywords) {
            if (normalized.contains(normalizeText(keyword))) {
                score += 5;
            }
        }
        return score;
    }

    private String describeScope(RoleCode roleCode) {
        return switch (roleCode) {
            case ADMIN -> "all campus tickets";
            case STAFF -> "tickets you reported or are assigned to";
            case STUDENT -> "tickets you reported";
        };
    }

    private String formatDateTime(LocalDateTime value) {
        return value == null ? "Not available" : value.format(DATE_TIME_FORMATTER);
    }

    private String normalizeText(String value) {
        if (value == null) {
            return "";
        }
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
    }

    private String toTitleCase(String value) {
        return Arrays.stream(value.toLowerCase(Locale.ROOT).split("_"))
                .map(segment -> Character.toUpperCase(segment.charAt(0)) + segment.substring(1))
                .collect(Collectors.joining(" "));
    }

    private List<String> distinctNonBlank(Collection<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream().map(this::blankToNull).filter(Objects::nonNull).distinct().toList();
    }

    private String blankToNull(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }

    private String sanitizeAssistantText(String value) {
        String normalized = blankToNull(value);
        if (normalized == null) {
            return null;
        }
        return normalized
                .replace("**", "")
                .replace("__", "")
                .replace("`", "")
                .replace("\r", "")
                .replaceAll("[ \\t]*\\n[ \\t]*", "\n")
                .replaceAll("\\n{3,}", "\n\n")
                .replaceAll("[ \\t]{2,}", " ")
                .trim();
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private String coalesce(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private boolean assistantEnabled() {
        String trimmed = blankToNull(apiKey);
        return trimmed != null && !"your-openrouter-key".equalsIgnoreCase(trimmed);
    }

    private String completeText(String systemPrompt, String userPrompt, int maxTokens) {
        if (!assistantEnabled()) {
            return null;
        }

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", blankToNull(model) == null ? "openrouter/auto" : model.trim());
        requestBody.put("temperature", 0.2);
        requestBody.put("max_tokens", maxTokens);
        requestBody.put(
                "messages",
                List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)));

        try {
            JsonNode response =
                    restClientBuilder
                            .build()
                            .post()
                            .uri(trimTrailingSlash(baseUrl) + "/chat/completions")
                            .headers(this::applyAssistantHeaders)
                            .body(requestBody)
                            .retrieve()
                            .body(JsonNode.class);
            return response == null ? null : extractContent(response);
        } catch (RestClientException ex) {
            log.warn("Ticket assistant text completion failed", ex);
            return null;
        }
    }

    private void applyAssistantHeaders(HttpHeaders headers) {
        headers.setBearerAuth(apiKey.trim());
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        if (blankToNull(frontendUrl) != null) {
            headers.set("HTTP-Referer", frontendUrl.trim());
        }
        headers.set("X-Title", "Smart Campus Ticketing");
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
                String text = entry.path("text").isTextual() ? entry.path("text").asText() : null;
                if (text != null && !text.isBlank()) {
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

    private String trimTrailingSlash(String value) {
        String trimmed = value == null ? "" : value.trim();
        return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
    }

    private record TicketContext(Ticket ticket, TicketDetailResponse detail) {}

    private record ScoredTicket(TicketSummaryResponse ticket, int score) {}

    private record TimelineEvent(LocalDateTime at, String label) {}

    private record SourceIssue(
            Long ticketId,
            String text,
            String locationLabel,
            String resourceLabel,
            Long categoryId,
            Long locationId,
            Long resourceId) {}

    private record Recommendation(TicketCategory category, TicketPriority priority, List<String> reasons) {}

    private record DuplicateCandidate(Ticket ticket, int score) {}
}
