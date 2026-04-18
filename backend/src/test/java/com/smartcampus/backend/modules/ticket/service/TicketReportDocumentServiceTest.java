package com.smartcampus.backend.modules.ticket.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.smartcampus.backend.common.enums.CommentType;
import com.smartcampus.backend.common.enums.TicketPriority;
import com.smartcampus.backend.common.enums.TicketReportFormat;
import com.smartcampus.backend.common.enums.TicketReportType;
import com.smartcampus.backend.common.enums.TicketStatus;
import com.smartcampus.backend.modules.ticket.dto.GenerateTicketReportRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketAssignmentResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketCommentResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketDetailResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketSummaryResponse;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

class TicketReportDocumentServiceTest {

    private final TicketReportDocumentService service = new TicketReportDocumentService();

    @Test
    void renderSummaryPdfReturnsBytes() {
        GenerateTicketReportRequest request =
                new GenerateTicketReportRequest(
                        null,
                        null,
                        TicketReportType.SUMMARY,
                        TicketReportFormat.PDF,
                        TicketStatus.OPEN,
                        null,
                        null,
                        null,
                        null,
                        null,
                        10L,
                        null,
                        null,
                        "open tickets");
        LocalDateTime now = LocalDateTime.now();
        TicketSummaryResponse summary =
                new TicketSummaryResponse(
                        1L,
                        "TCK-20260418-AAAAAA",
                        10L,
                        "Student User",
                        20L,
                        "Staff User",
                        null,
                        null,
                        99L,
                        "Lab 3",
                        5L,
                        "AV_EQUIPMENT",
                        "AV / Equipment",
                        "Projector blue screen",
                        TicketPriority.HIGH,
                        TicketStatus.OPEN,
                        now.minusHours(2),
                        now.minusMinutes(20),
                        null,
                        null,
                        0,
                        0,
                        0);

        TicketReportDocumentService.RenderedTicketReport rendered =
                service.renderSummaryReport(request, "Student User", "Status: Open", List.of(summary));

        assertEquals("application/pdf", rendered.mimeType());
        assertEquals(1, rendered.recordCount());
        assertTrue(rendered.fileData().length > 0);
    }

    @Test
    void renderDetailPdfReturnsBytes() {
        GenerateTicketReportRequest request =
                new GenerateTicketReportRequest(
                        1L,
                        "TCK-20260418-AAAAAA",
                        TicketReportType.DETAIL,
                        TicketReportFormat.PDF,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        10L,
                        null,
                        null,
                        "detail report");
        LocalDateTime now = LocalDateTime.now();
        TicketDetailResponse detail =
                new TicketDetailResponse(
                        1L,
                        "TCK-20260418-AAAAAA",
                        10L,
                        "student@example.com",
                        "Student User",
                        20L,
                        "Staff User",
                        300L,
                        "PRJ-01",
                        "Projector A",
                        "AV",
                        99L,
                        "Lab 3",
                        "Engineering",
                        "2",
                        "203",
                        "Computer lab",
                        5L,
                        "AV_EQUIPMENT",
                        "AV / Equipment",
                        "Projector blue screen",
                        "Projector shows a blue screen during class.",
                        TicketPriority.HIGH,
                        TicketStatus.RESOLVED,
                        "Student User",
                        "student@example.com",
                        "0771234567",
                        "HDMI cable was replaced.",
                        null,
                        null,
                        now.minusHours(1),
                        now.minusMinutes(10),
                        null,
                        null,
                        null,
                        null,
                        now.minusHours(5),
                        now.minusMinutes(5),
                        0,
                        1,
                        1,
                        List.of(
                                new TicketAssignmentResponse(
                                        1L,
                                        20L,
                                        "Staff User",
                                        30L,
                                        "Admin User",
                                        "Handle AV issue",
                                        false,
                                        now.minusHours(4),
                                        now.minusMinutes(10))));
        List<TicketCommentResponse> comments =
                List.of(
                        new TicketCommentResponse(
                                1L,
                                20L,
                                "Staff User",
                                "Issue fixed and tested.",
                                CommentType.PUBLIC_REPLY,
                                null,
                                false,
                                null,
                                now.minusMinutes(12),
                                now.minusMinutes(12)));
        List<TicketAttachmentResponse> attachments =
                List.of(
                        new TicketAttachmentResponse(
                                1L,
                                10L,
                                "Student User",
                                "projector",
                                "projector.jpg",
                                "ticket-attachments",
                                "tickets/1/projector.jpg",
                                "image/jpeg",
                                1024L,
                                "IMAGE",
                                now.minusHours(5)));

        TicketReportDocumentService.RenderedTicketReport rendered =
                service.renderDetailReport(
                        request, "Student User", "Ticket number: TCK-20260418-AAAAAA", detail, comments, attachments);

        assertEquals("application/pdf", rendered.mimeType());
        assertEquals(1, rendered.recordCount());
        assertTrue(rendered.fileData().length > 0);
    }
}
