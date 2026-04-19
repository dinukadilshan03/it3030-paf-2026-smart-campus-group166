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
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import javax.imageio.ImageIO;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
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
        List<TicketReportDocumentService.AttachmentEvidence> attachments =
                List.of(
                        new TicketReportDocumentService.AttachmentEvidence(
                                new TicketAttachmentResponse(
                                        1L,
                                        10L,
                                        "Student User",
                                        "projector",
                                        "projector.jpg",
                                        "ticket-attachments",
                                        "tickets/1/projector.jpg",
                                        "image/png",
                                        1024L,
                                        "IMAGE",
                                        now.minusHours(5)),
                                createPngImageBytes(),
                                "image/png"));

        TicketReportDocumentService.RenderedTicketReport rendered =
                service.renderDetailReport(
                        request, "Student User", "Ticket number: TCK-20260418-AAAAAA", detail, comments, attachments);

        assertEquals("application/pdf", rendered.mimeType());
        assertEquals(1, rendered.recordCount());
        assertTrue(rendered.fileData().length > 0);
        assertTrue(countEmbeddedImages(rendered.fileData()) > 0);
    }

    @Test
    void renderDetailPdfSanitizesUnsupportedCharacters() {
        GenerateTicketReportRequest request =
                new GenerateTicketReportRequest(
                        2L,
                        "TCK-20260419-UNICODE",
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
                        "detail report with unicode");
        LocalDateTime now = LocalDateTime.now();
        TicketDetailResponse detail =
                new TicketDetailResponse(
                        2L,
                        "TCK-20260419-UNICODE",
                        10L,
                        "student@example.com",
                        "Nimal Perera",
                        20L,
                        "Facilities Team",
                        null,
                        null,
                        null,
                        null,
                        99L,
                        "Main Hall",
                        "Academic",
                        "1",
                        "A-12",
                        "Lecturer said the projector won’t start — screen stays black.",
                        5L,
                        "AV_EQUIPMENT",
                        "AV / Equipment",
                        "Projector won’t start — lecturer notes “flicker” before shutdown.",
                        "The display shows a black screen, then resets… Student also reported noise • please inspect 🙂",
                        TicketPriority.HIGH,
                        TicketStatus.IN_PROGRESS,
                        "Nimal Perera",
                        "student@example.com",
                        "0771234567",
                        null,
                        null,
                        null,
                        now.minusHours(3),
                        null,
                        null,
                        null,
                        null,
                        null,
                        now.minusHours(6),
                        now.minusHours(1),
                        0,
                        0,
                        0,
                        List.of());
        List<TicketCommentResponse> comments =
                List.of(
                        new TicketCommentResponse(
                                2L,
                                20L,
                                "Facilities Team",
                                "Checked the room — lamp warning appears and the lecturer’s note matches the fault.",
                                CommentType.PUBLIC_REPLY,
                                null,
                                false,
                                null,
                                now.minusMinutes(45),
                                now.minusMinutes(45)));

        TicketReportDocumentService.RenderedTicketReport rendered =
                service.renderDetailReport(
                        request,
                        "Nimal Perera",
                        "Ticket number: TCK-20260419-UNICODE | Requested through assistant",
                        detail,
                        comments,
                        List.of());

        assertEquals("application/pdf", rendered.mimeType());
        assertEquals(1, rendered.recordCount());
        assertTrue(rendered.fileData().length > 0);
    }

    @Test
    void renderDetailPdfHandlesNullAssignmentFlagsAndSparseLists() {
        GenerateTicketReportRequest request =
                new GenerateTicketReportRequest(
                        3L,
                        "TCK-20260419-SPARSE",
                        TicketReportType.DETAIL,
                        TicketReportFormat.PDF,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null);
        LocalDateTime now = LocalDateTime.now();
        TicketDetailResponse detail =
                new TicketDetailResponse(
                        3L,
                        "TCK-20260419-SPARSE",
                        10L,
                        "student@example.com",
                        "Student User",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        99L,
                        "Hall A",
                        null,
                        null,
                        null,
                        null,
                        5L,
                        "AV_EQUIPMENT",
                        "AV / Equipment",
                        "Loose HDMI cable",
                        "Signal drops during lectures.",
                        TicketPriority.MEDIUM,
                        TicketStatus.OPEN,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        now.minusHours(4),
                        now.minusHours(1),
                        0,
                        0,
                        0,
                        java.util.Arrays.asList(
                                null,
                                new TicketAssignmentResponse(
                                        9L,
                                        20L,
                                        "Staff User",
                                        30L,
                                        "Admin User",
                                        null,
                                        null,
                                        now.minusHours(2),
                                        null)));

        TicketReportDocumentService.RenderedTicketReport rendered =
                service.renderDetailReport(
                        request,
                        "Admin User",
                        "Ticket number: TCK-20260419-SPARSE",
                        detail,
                        java.util.Arrays.asList((TicketCommentResponse) null),
                        java.util.Arrays.asList((TicketReportDocumentService.AttachmentEvidence) null));

        assertEquals("application/pdf", rendered.mimeType());
        assertEquals(1, rendered.recordCount());
        assertTrue(rendered.fileData().length > 0);
    }

    private byte[] createPngImageBytes() {
        try {
            BufferedImage image = new BufferedImage(12, 12, BufferedImage.TYPE_INT_RGB);
            for (int y = 0; y < image.getHeight(); y++) {
                for (int x = 0; x < image.getWidth(); x++) {
                    image.setRGB(x, y, (x + y) % 2 == 0 ? Color.WHITE.getRGB() : Color.GRAY.getRGB());
                }
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ImageIO.write(image, "png", outputStream);
            return outputStream.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("Could not create test attachment image", ex);
        }
    }

    private int countEmbeddedImages(byte[] pdfBytes) {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            int count = 0;
            for (PDPage page : document.getPages()) {
                for (COSName name : page.getResources().getXObjectNames()) {
                    if (page.getResources().isImageXObject(name)) {
                        count++;
                    }
                }
            }
            return count;
        } catch (IOException ex) {
            throw new IllegalStateException("Could not inspect rendered PDF", ex);
        }
    }
}
