package com.smartcampus.backend.modules.ticket.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.TicketReportFormat;
import com.smartcampus.backend.common.enums.TicketReportStatus;
import com.smartcampus.backend.common.enums.TicketReportType;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.modules.resource.entity.Location;
import com.smartcampus.backend.modules.resource.entity.Resource;
import com.smartcampus.backend.modules.resource.service.LocationService;
import com.smartcampus.backend.modules.resource.service.ResourceService;
import com.smartcampus.backend.modules.ticket.dto.GenerateTicketReportRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketCommentResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketDetailResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketReportDownloadPayload;
import com.smartcampus.backend.modules.ticket.dto.TicketReportResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketSummaryResponse;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketCategory;
import com.smartcampus.backend.modules.ticket.entity.TicketReport;
import com.smartcampus.backend.modules.ticket.repository.TicketReportRepository;
import com.smartcampus.backend.modules.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketReportService {

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd", Locale.ROOT);

    private final TicketReportRepository ticketReportRepository;
    private final TicketReportDocumentService ticketReportDocumentService;
    private final TicketService ticketService;
    private final TicketCommentService ticketCommentService;
    private final TicketAttachmentService ticketAttachmentService;
    private final TicketAccessService ticketAccessService;
    private final TicketCategoryService ticketCategoryService;
    private final LocationService locationService;
    private final ResourceService resourceService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<TicketReportResponse> getReports() {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        List<TicketReport> reports =
                membership.getRole().getCode() == RoleCode.ADMIN
                        ? ticketReportRepository.findAllWithUserOrderByGeneratedAtDesc()
                        : ticketReportRepository.findByGeneratedByUserIdOrderByGeneratedAtDesc(
                                membership.getUser().getId());

        return reports.stream().map(this::toResponse).toList();
    }

    @Transactional
    public TicketReportResponse generateReport(GenerateTicketReportRequest request) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        validateRequest(membership, request);

        String generatedByDisplayName = resolveDisplayName(membership.getUser());
        String filterSummary = buildFilterSummary(membership, request);
        TicketReportDocumentService.RenderedTicketReport renderedReport;

        if (request.reportType() == TicketReportType.DETAIL) {
            Ticket ticket = resolveDetailedTicket(request);
            ticketAccessService.ensureCanViewTicket(membership, ticket);

            TicketDetailResponse detail = ticketService.getTicketById(ticket.getId());
            List<TicketCommentResponse> comments = ticketCommentService.getComments(ticket);
            List<TicketAttachmentResponse> attachments =
                    ticketAttachmentService.getAttachments(ticket);

            renderedReport =
                    ticketReportDocumentService.renderDetailReport(
                            request,
                            generatedByDisplayName,
                            filterSummary,
                            detail,
                            comments,
                            attachments);
        } else {
            List<TicketSummaryResponse> tickets = resolveSummaryTickets(request);
            if (tickets.isEmpty()) {
                throw new IllegalArgumentException(
                        "No tickets matched the selected filters. Adjust the report criteria and try again.");
            }

            renderedReport =
                    ticketReportDocumentService.renderSummaryReport(
                            request, generatedByDisplayName, filterSummary, tickets);
        }

        TicketReport report =
                TicketReport.builder()
                        .generatedByUser(membership.getUser())
                        .reportType(request.reportType())
                        .format(request.format())
                        .status(TicketReportStatus.READY)
                        .recordCount(renderedReport.recordCount())
                        .fileName(renderedReport.fileName())
                        .mimeType(renderedReport.mimeType())
                        .filterJson(serializeRequest(request))
                        .filterSummary(trimToLength(filterSummary, 500))
                        .summaryText(renderedReport.summaryText())
                        .naturalLanguageRequest(normalizeOptionalText(request.naturalLanguageRequest()))
                        .fileData(renderedReport.fileData())
                        .build();

        return toResponse(ticketReportRepository.save(report));
    }

    @Transactional(readOnly = true)
    public TicketReportDownloadPayload downloadReport(Long reportId) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        TicketReport report =
                ticketReportRepository
                        .findDetailedById(reportId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Ticket report not found for id: " + reportId));
        ensureCanAccessReport(membership, report);

        return new TicketReportDownloadPayload(
                report.getFileName(), report.getMimeType(), report.getFileData());
    }

    private void validateRequest(UserRole membership, GenerateTicketReportRequest request) {
        if (request.format() != TicketReportFormat.PDF) {
            throw new IllegalArgumentException("Only PDF ticket reports are supported.");
        }

        if (request.startDate() != null
                && request.endDate() != null
                && request.startDate().isAfter(request.endDate())) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }

        if (request.reportType() == TicketReportType.DETAIL
                && request.ticketId() == null
                && normalizeOptionalText(request.ticketNumber()) == null) {
            throw new IllegalArgumentException(
                    "A ticket ID or ticket number is required for a detailed report");
        }

        TicketCategory category = null;
        Resource resource = null;
        Location location = null;

        if (request.ticketCategoryId() != null) {
            category = ticketCategoryService.getManagedCategory(request.ticketCategoryId());
        }
        if (request.locationId() != null) {
            location = locationService.getManagedLocation(request.locationId());
        }
        if (request.resourceId() != null) {
            resource = resourceService.getManagedResource(request.resourceId());
        }

        if (resource != null && location != null && !resource.getLocation().getId().equals(location.getId())) {
            throw new IllegalArgumentException(
                    "Resource and location filters must refer to the same location");
        }

        if (request.reporterUserId() != null) {
            userRepository
                    .findById(request.reporterUserId())
                    .orElseThrow(
                            () ->
                                    new ResourceNotFoundException(
                                            "User not found for id: " + request.reporterUserId()));
        }
        if (request.assignedStaffUserId() != null) {
            userRepository
                    .findById(request.assignedStaffUserId())
                    .orElseThrow(
                            () ->
                                    new ResourceNotFoundException(
                                            "User not found for id: "
                                                    + request.assignedStaffUserId()));
        }

        RoleCode roleCode = membership.getRole().getCode();
        Long currentUserId = membership.getUser().getId();
        if (roleCode == RoleCode.STUDENT) {
            if (request.reporterUserId() != null && !request.reporterUserId().equals(currentUserId)) {
                throw new AccessDeniedException(
                        "Students can generate reports only for their own tickets");
            }
            if (request.assignedStaffUserId() != null) {
                throw new AccessDeniedException(
                        "Students cannot filter ticket reports by assigned staff");
            }
        }

        if (roleCode == RoleCode.STAFF) {
            if (request.reporterUserId() != null && !request.reporterUserId().equals(currentUserId)) {
                throw new AccessDeniedException(
                        "Staff can only filter reports for tickets they reported");
            }
            if (request.assignedStaffUserId() != null
                    && !request.assignedStaffUserId().equals(currentUserId)) {
                throw new AccessDeniedException(
                        "Staff can only filter reports for tickets assigned to themselves");
            }
        }
    }

    private List<TicketSummaryResponse> resolveSummaryTickets(GenerateTicketReportRequest request) {
        String search =
                normalizeOptionalText(request.ticketNumber()) == null ? null : request.ticketNumber();

        return ticketService.getTickets(
                        request.status(), request.priority(), request.ticketCategoryId(), search)
                .stream()
                .filter(ticket -> matchesTicketId(ticket, request.ticketId()))
                .filter(ticket -> matchesTicketNumber(ticket, request.ticketNumber()))
                .filter(ticket -> matchesReporter(ticket, request.reporterUserId()))
                .filter(ticket -> matchesAssignee(ticket, request.assignedStaffUserId()))
                .filter(ticket -> matchesLocation(ticket, request.locationId()))
                .filter(ticket -> matchesResource(ticket, request.resourceId()))
                .filter(ticket -> matchesStartDate(ticket, request.startDate()))
                .filter(ticket -> matchesEndDate(ticket, request.endDate()))
                .toList();
    }

    private Ticket resolveDetailedTicket(GenerateTicketReportRequest request) {
        if (request.ticketId() != null) {
            Ticket ticket = ticketService.getDetailedTicketEntity(request.ticketId());
            String requestedTicketNumber = normalizeOptionalText(request.ticketNumber());
            if (requestedTicketNumber != null
                    && !ticket.getTicketNumber().equalsIgnoreCase(requestedTicketNumber)) {
                throw new IllegalArgumentException(
                        "Ticket ID and ticket number must refer to the same ticket");
            }
            return ticket;
        }

        List<TicketSummaryResponse> matchingTickets =
                ticketService.getTickets(null, null, null, normalizeOptionalText(request.ticketNumber()));
        TicketSummaryResponse summary =
                matchingTickets.stream()
                        .filter(ticket -> matchesTicketNumber(ticket, request.ticketNumber()))
                        .findFirst()
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Ticket not found for number: " + request.ticketNumber()));

        return ticketService.getDetailedTicketEntity(summary.id());
    }

    private String buildFilterSummary(UserRole membership, GenerateTicketReportRequest request) {
        List<String> fragments = new ArrayList<>();
        fragments.add("Scope: " + resolveScopeLabel(membership.getRole().getCode()));
        fragments.add(
                "Report: "
                        + (request.reportType() == TicketReportType.DETAIL
                                ? "Single ticket detail"
                                : "Ticket summary"));
        fragments.add("Format: " + request.format().name());

        if (request.ticketId() != null) {
            fragments.add("Ticket ID: " + request.ticketId());
        }
        if (normalizeOptionalText(request.ticketNumber()) != null) {
            fragments.add("Ticket number: " + request.ticketNumber().trim().toUpperCase(Locale.ROOT));
        }
        if (request.status() != null) {
            fragments.add("Status: " + toTitleCase(request.status().name()));
        }
        if (request.priority() != null) {
            fragments.add("Priority: " + toTitleCase(request.priority().name()));
        }
        if (request.ticketCategoryId() != null) {
            TicketCategory category = ticketCategoryService.getManagedCategory(request.ticketCategoryId());
            fragments.add("Category: " + category.getName());
        }
        if (request.locationId() != null) {
            Location location = locationService.getManagedLocation(request.locationId());
            fragments.add("Location: " + location.getName());
        }
        if (request.resourceId() != null) {
            Resource resource = resourceService.getManagedResource(request.resourceId());
            fragments.add("Resource: " + resource.getName());
        }
        if (request.assignedStaffUserId() != null) {
            fragments.add("Assigned staff: " + resolveUserDisplayName(request.assignedStaffUserId()));
        }
        if (request.reporterUserId() != null) {
            fragments.add("Reporter: " + resolveUserDisplayName(request.reporterUserId()));
        }
        if (request.startDate() != null || request.endDate() != null) {
            fragments.add(
                    "Created between "
                            + formatDate(request.startDate(), "Any time")
                            + " and "
                            + formatDate(request.endDate(), "Now"));
        }
        if (normalizeOptionalText(request.naturalLanguageRequest()) != null) {
            fragments.add("Requested through the report assistant");
        }

        return trimToLength(String.join(" | ", fragments), 500);
    }

    private TicketReportResponse toResponse(TicketReport report) {
        return new TicketReportResponse(
                report.getId(),
                report.getGeneratedByUser().getId(),
                resolveDisplayName(report.getGeneratedByUser()),
                report.getReportType(),
                report.getFormat(),
                report.getStatus(),
                report.getRecordCount(),
                report.getFileName(),
                report.getMimeType(),
                report.getFilterSummary(),
                report.getSummaryText(),
                report.getNaturalLanguageRequest(),
                report.getGeneratedAt());
    }

    private void ensureCanAccessReport(UserRole membership, TicketReport report) {
        if (membership.getRole().getCode() == RoleCode.ADMIN) {
            return;
        }
        if (report.getGeneratedByUser().getId().equals(membership.getUser().getId())) {
            return;
        }
        throw new AccessDeniedException("You do not have permission to access this report");
    }

    private boolean matchesTicketId(TicketSummaryResponse ticket, Long ticketId) {
        return ticketId == null || ticket.id().equals(ticketId);
    }

    private boolean matchesTicketNumber(TicketSummaryResponse ticket, String ticketNumber) {
        String normalized = normalizeOptionalText(ticketNumber);
        return normalized == null || ticket.ticketNumber().equalsIgnoreCase(normalized);
    }

    private boolean matchesReporter(TicketSummaryResponse ticket, Long reporterUserId) {
        return reporterUserId == null || ticket.reporterUserId().equals(reporterUserId);
    }

    private boolean matchesAssignee(TicketSummaryResponse ticket, Long assignedStaffUserId) {
        return assignedStaffUserId == null
                || (ticket.assignedStaffUserId() != null
                        && ticket.assignedStaffUserId().equals(assignedStaffUserId));
    }

    private boolean matchesLocation(TicketSummaryResponse ticket, Long locationId) {
        return locationId == null
                || (ticket.locationId() != null && ticket.locationId().equals(locationId));
    }

    private boolean matchesResource(TicketSummaryResponse ticket, Long resourceId) {
        return resourceId == null
                || (ticket.resourceId() != null && ticket.resourceId().equals(resourceId));
    }

    private boolean matchesStartDate(TicketSummaryResponse ticket, LocalDate startDate) {
        return startDate == null || !ticket.createdAt().toLocalDate().isBefore(startDate);
    }

    private boolean matchesEndDate(TicketSummaryResponse ticket, LocalDate endDate) {
        return endDate == null || !ticket.createdAt().toLocalDate().isAfter(endDate);
    }

    private String serializeRequest(GenerateTicketReportRequest request) {
        try {
            return objectMapper.writeValueAsString(request);
        } catch (JsonProcessingException ex) {
            log.warn("Could not serialize ticket report request", ex);
            return null;
        }
    }

    private String resolveScopeLabel(RoleCode roleCode) {
        return switch (roleCode) {
            case ADMIN -> "All campus ticket records";
            case STAFF -> "Tickets you reported or are assigned to";
            case STUDENT -> "Tickets you reported";
        };
    }

    private String resolveUserDisplayName(Long userId) {
        return userRepository
                .findById(userId)
                .map(this::resolveDisplayName)
                .orElse("User #" + userId);
    }

    private String resolveDisplayName(User user) {
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName();
        }
        return user.getEmail();
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String formatDate(LocalDate value, String fallback) {
        return value == null ? fallback : value.format(DATE_FORMATTER);
    }

    private String trimToLength(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }

    private String toTitleCase(String value) {
        return java.util.Arrays.stream(value.toLowerCase(Locale.ROOT).split("_"))
                .map(segment -> Character.toUpperCase(segment.charAt(0)) + segment.substring(1))
                .reduce((left, right) -> left + " " + right)
                .orElse(value);
    }
}
