package com.smartcampus.backend.modules.ticket.controller;

import com.smartcampus.backend.modules.ticket.dto.GenerateTicketReportRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketReportAssistantInterpretRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketReportAssistantResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketReportDownloadPayload;
import com.smartcampus.backend.modules.ticket.dto.TicketReportResponse;
import com.smartcampus.backend.modules.ticket.service.TicketReportAssistantService;
import com.smartcampus.backend.modules.ticket.service.TicketReportService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ticket-reports")
@RequiredArgsConstructor
public class TicketReportController {

    private final TicketReportService ticketReportService;
    private final TicketReportAssistantService ticketReportAssistantService;

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public List<TicketReportResponse> getReports() {
        return ticketReportService.getReports();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public TicketReportResponse generateReport(
            @Valid @RequestBody GenerateTicketReportRequest request) {
        return ticketReportService.generateReport(request);
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('STUDENT', 'STAFF', 'ADMIN')")
    public ResponseEntity<ByteArrayResource> downloadReport(@PathVariable Long id) {
        TicketReportDownloadPayload payload = ticketReportService.downloadReport(id);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(payload.fileName()).build().toString())
                .contentType(MediaType.parseMediaType(payload.mimeType()))
                .contentLength(payload.fileData().length)
                .body(new ByteArrayResource(payload.fileData()));
    }

    @PostMapping("/assistant/interpret")
    @PreAuthorize("hasRole('STUDENT')")
    public TicketReportAssistantResponse interpretAssistantRequest(
            @Valid @RequestBody TicketReportAssistantInterpretRequest request) {
        return ticketReportAssistantService.interpret(request);
    }
}
