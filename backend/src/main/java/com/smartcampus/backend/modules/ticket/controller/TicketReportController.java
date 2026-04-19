package com.smartcampus.backend.modules.ticket.controller;

// Request DTO used when generating a new report
import com.smartcampus.backend.modules.ticket.dto.GenerateTicketReportRequest;

// Request DTO used when asking the assistant to interpret a report-related request
import com.smartcampus.backend.modules.ticket.dto.TicketReportAssistantInterpretRequest;

// Response DTO returned by the report assistant
import com.smartcampus.backend.modules.ticket.dto.TicketReportAssistantResponse;

// DTO that contains downloadable report data such as file name, MIME type, and file bytes
import com.smartcampus.backend.modules.ticket.dto.TicketReportDownloadPayload;

// Response DTO returned when report details/metadata are sent to the frontend
import com.smartcampus.backend.modules.ticket.dto.TicketReportResponse;

// Service layer that handles report assistant logic
import com.smartcampus.backend.modules.ticket.service.TicketReportAssistantService;

// Service layer that handles ticket report generation, retrieval, and download
import com.smartcampus.backend.modules.ticket.service.TicketReportService;

// Used to trigger validation annotations inside request DTOs
import jakarta.validation.Valid;

import java.util.List;

// Lombok annotation that automatically generates constructor injection for final fields
import lombok.RequiredArgsConstructor;

// Used to wrap byte[] data as a Spring resource for file download responses
import org.springframework.core.io.ByteArrayResource;

// Used to build the Content-Disposition header for file downloads
import org.springframework.http.ContentDisposition;

// Used to set HTTP headers such as Content-Disposition
import org.springframework.http.HttpHeaders;

// Used for response status codes like 201 Created
import org.springframework.http.HttpStatus;

// Used to set the MIME type of the response body
import org.springframework.http.MediaType;

// Used to build full HTTP responses with headers, body, and status
import org.springframework.http.ResponseEntity;

// Used for method-level role-based authorization
import org.springframework.security.access.prepost.PreAuthorize;

// Spring MVC annotations for REST endpoint mappings
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController // Marks this class as a REST controller and returns JSON / HTTP responses
@RequestMapping("/api/v1/ticket-reports") // Base URL for all ticket report-related APIs
@RequiredArgsConstructor // Generates constructor for final fields for dependency injection
public class TicketReportController {

    // Service dependency that handles ticket report operations
    private final TicketReportService ticketReportService;

    // Service dependency that handles assistant-based interpretation for reports
    private final TicketReportAssistantService ticketReportAssistantService;

    // GET API: /api/v1/ticket-reports
    // Purpose: Retrieve all available ticket reports
    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')") // Allows students, staff, and admins
    public List<TicketReportResponse> getReports() {
        // Returns report metadata/details as a list
        return ticketReportService.getReports();
    }

    // POST API: /api/v1/ticket-reports
    // Purpose: Generate a new ticket report
    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')") // Allows students, staff, and admins
    @ResponseStatus(HttpStatus.CREATED) // Returns HTTP 201 when the report is successfully generated
    public TicketReportResponse generateReport(
            @Valid @RequestBody GenerateTicketReportRequest request) {
        // @RequestBody converts incoming JSON into GenerateTicketReportRequest
        // @Valid applies validation rules defined inside the DTO
        return ticketReportService.generateReport(request);
    }

    // GET API: /api/v1/ticket-reports/{id}/download
    // Purpose: Download the generated report file by report ID
    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')") // Allows students, staff, and admins
    public ResponseEntity<ByteArrayResource> downloadReport(@PathVariable Long id) {
        // Download is done using id because id uniquely identifies
        // which report should be downloaded
        TicketReportDownloadPayload payload = ticketReportService.downloadReport(id);

        // Builds a downloadable HTTP response:
        // - Content-Disposition attachment = browser treats it as a downloadable file
        // - filename = the report file name
        // - contentType = correct MIME type such as application/pdf
        // - contentLength = size of the file
        // - body = actual file bytes wrapped in ByteArrayResource
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(payload.fileName()).build().toString())
                .contentType(MediaType.parseMediaType(payload.mimeType()))
                .contentLength(payload.fileData().length)
                .body(new ByteArrayResource(payload.fileData()));
    }

    // POST API: /api/v1/ticket-reports/assistant/interpret
    // Purpose: Allow the report assistant to interpret a natural-language report-related request
    @PostMapping("/assistant/interpret")
    @PreAuthorize("hasRole('STUDENT')") // Only STUDENT users are allowed to use this assistant endpoint
    public TicketReportAssistantResponse interpretAssistantRequest(
            @Valid @RequestBody TicketReportAssistantInterpretRequest request) {
        // Sends the request to the report assistant service and returns the assistant response
        return ticketReportAssistantService.interpret(request);
    }
}