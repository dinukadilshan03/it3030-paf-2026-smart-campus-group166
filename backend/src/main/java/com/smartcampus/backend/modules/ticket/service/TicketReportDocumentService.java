package com.smartcampus.backend.modules.ticket.service;

import com.smartcampus.backend.common.enums.TicketPriority;
import com.smartcampus.backend.common.enums.TicketReportFormat;
import com.smartcampus.backend.common.enums.TicketStatus;
import com.smartcampus.backend.modules.ticket.dto.GenerateTicketReportRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketAssignmentResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketCommentResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketDetailResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketSummaryResponse;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.PDPageContentStream.AppendMode;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class TicketReportDocumentService {

    private static final DateTimeFormatter TIMESTAMP_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm", Locale.ROOT);
    private static final DateTimeFormatter FILE_DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss", Locale.ROOT);

    public RenderedTicketReport renderSummaryReport(
            GenerateTicketReportRequest request,
            String generatedByDisplayName,
            String filterSummary,
            List<TicketSummaryResponse> tickets) {
        return switch (request.format()) {
            case PDF -> renderSummaryPdf(request, generatedByDisplayName, filterSummary, tickets);
            case CSV -> renderSummaryCsv(request, filterSummary, tickets);
        };
    }

    public RenderedTicketReport renderDetailReport(
            GenerateTicketReportRequest request,
            String generatedByDisplayName,
            String filterSummary,
            TicketDetailResponse detail,
            List<TicketCommentResponse> comments,
            List<TicketAttachmentResponse> attachments) {
        return switch (request.format()) {
            case PDF ->
                    renderDetailPdf(
                            request,
                            generatedByDisplayName,
                            filterSummary,
                            detail,
                            comments,
                            attachments);
            case CSV -> renderDetailCsv(request, filterSummary, detail, comments, attachments);
        };
    }

    private RenderedTicketReport renderSummaryPdf(
            GenerateTicketReportRequest request,
            String generatedByDisplayName,
            String filterSummary,
            List<TicketSummaryResponse> tickets) {
        String fileName =
                "ticket_summary_%s.pdf"
                        .formatted(LocalDateTime.now().format(FILE_DATE_FORMATTER));
        String summaryText =
                "Summary report with %d ticket(s) prepared for %s."
                        .formatted(tickets.size(), generatedByDisplayName);

        try (PDDocument document = new PDDocument()) {
            try (PdfWriter writer =
                    new PdfWriter(
                            document,
                            "Ticket Summary Report",
                            "Campus maintenance and incident overview")) {
                writer.writeHeroCard(
                        "Smart Campus Ticketing",
                        "Ticket Summary Report",
                        "A formal overview of the ticket queue captured for the selected access scope and report filters.",
                        List.of(
                                "Prepared for | " + generatedByDisplayName,
                                "Prepared at | " + LocalDateTime.now().format(TIMESTAMP_FORMATTER),
                                "Document type | Summary PDF"));
                writer.writeStatGrid(
                        List.of(
                                new StatItem("Tickets in scope", String.valueOf(tickets.size()), PdfTone.SLATE),
                                new StatItem(
                                        "Open",
                                        String.valueOf(countByStatus(tickets, TicketStatus.OPEN)),
                                        PdfTone.SKY),
                                new StatItem(
                                        "In Progress",
                                        String.valueOf(countByStatus(tickets, TicketStatus.IN_PROGRESS)),
                                        PdfTone.AMBER),
                                new StatItem(
                                        "Resolved",
                                        String.valueOf(countByStatus(tickets, TicketStatus.RESOLVED)),
                                        PdfTone.EMERALD)));
                writer.writeParagraphCard(
                        "Reporting scope",
                        safeValue(filterSummary),
                        PdfTone.SKY);

                for (TicketSummaryResponse ticket : tickets) {
                    writer.writeCard(
                            ticket.ticketNumber() + "  |  " + ticket.title(),
                            List.of(
                                    "Status | " + toTitleCase(ticket.status().name()),
                                    "Priority | " + toTitleCase(ticket.priority().name()),
                                    "Category | " + ticket.ticketCategoryName(),
                                    "Reported scope | " + resolveSummaryScope(ticket),
                                    "Reporter | " + ticket.reporterDisplayName(),
                                    "Assigned Staff | "
                                            + (ticket.assignedStaffDisplayName() == null
                                                    ? "Not assigned"
                                                    : ticket.assignedStaffDisplayName()),
                                    "Created | " + formatDateTime(ticket.createdAt()),
                                    "Updated | " + formatDateTime(ticket.updatedAt()),
                                    "First Response | " + formatDateTime(ticket.firstRespondedAt()),
                                    "Resolved | " + formatDateTime(ticket.resolvedAt())),
                            toneForStatus(ticket.status()));
                }
            }

            return new RenderedTicketReport(
                    fileName,
                    "application/pdf",
                    saveDocument(document),
                    tickets.size(),
                    summaryText);
        } catch (IOException ex) {
            log.warn("Could not render summary PDF report", ex);
            throw new IllegalStateException("Could not generate the PDF report.");
        }
    }

    private RenderedTicketReport renderSummaryCsv(
            GenerateTicketReportRequest request,
            String filterSummary,
            List<TicketSummaryResponse> tickets) {
        String fileName =
                "ticket_summary_%s.csv"
                        .formatted(LocalDateTime.now().format(FILE_DATE_FORMATTER));
        String summaryText = "CSV summary export with %d ticket(s).".formatted(tickets.size());

        StringBuilder csv = new StringBuilder();
        csv.append(csvLine(
                "Report Type",
                "Generated At",
                "Filters",
                "Ticket Number",
                "Title",
                "Category",
                "Priority",
                "Status",
                "Reporter",
                "Assigned Staff",
                "Resource / Location",
                "Created At",
                "Updated At",
                "First Responded At",
                "Resolved At"));

        String generatedAt = LocalDateTime.now().format(TIMESTAMP_FORMATTER);
        for (TicketSummaryResponse ticket : tickets) {
            csv.append(
                    csvLine(
                            "SUMMARY",
                            generatedAt,
                            filterSummary,
                            ticket.ticketNumber(),
                            ticket.title(),
                            ticket.ticketCategoryName(),
                            ticket.priority().name(),
                            ticket.status().name(),
                            ticket.reporterDisplayName(),
                            safeValue(ticket.assignedStaffDisplayName()),
                            resolveSummaryScope(ticket),
                            formatDateTime(ticket.createdAt()),
                            formatDateTime(ticket.updatedAt()),
                            formatDateTime(ticket.firstRespondedAt()),
                            formatDateTime(ticket.resolvedAt())));
        }

        return new RenderedTicketReport(
                fileName,
                "text/csv",
                csv.toString().getBytes(StandardCharsets.UTF_8),
                tickets.size(),
                summaryText);
    }

    private RenderedTicketReport renderDetailPdf(
            GenerateTicketReportRequest request,
            String generatedByDisplayName,
            String filterSummary,
            TicketDetailResponse detail,
            List<TicketCommentResponse> comments,
            List<TicketAttachmentResponse> attachments) {
        String safeTicketNumber =
                detail.ticketNumber().replaceAll("[^A-Za-z0-9_-]+", "_").toLowerCase(Locale.ROOT);
        String fileName = "ticket_%s_detail.pdf".formatted(safeTicketNumber);
        String summaryText =
                "Detailed %s report prepared for ticket %s."
                        .formatted(request.format().name(), detail.ticketNumber());

        try (PDDocument document = new PDDocument()) {
            try (PdfWriter writer =
                    new PdfWriter(
                            document,
                            "Ticket Detail Report",
                            "Full maintenance and incident ticket record")) {
                writer.writeHeroCard(
                        "Smart Campus Ticketing",
                        "Detailed Ticket Record",
                        detail.ticketNumber() + "  |  " + detail.title(),
                        List.of(
                                "Prepared for | " + generatedByDisplayName,
                                "Prepared at | " + LocalDateTime.now().format(TIMESTAMP_FORMATTER),
                                "Current status | " + toTitleCase(detail.status().name())));
                writer.writeStatGrid(
                        List.of(
                                new StatItem("Status", toTitleCase(detail.status().name()), toneForStatus(detail.status())),
                                new StatItem("Priority", toTitleCase(detail.priority().name()), toneForPriority(detail.priority())),
                                new StatItem("Comments", String.valueOf(comments.size()), PdfTone.SKY),
                                new StatItem("Attachments", String.valueOf(attachments.size()), PdfTone.EMERALD)));
                writer.writeParagraphCard("Reporting scope", safeValue(filterSummary), PdfTone.SKY);
                writer.writeCard(
                        "Ticket profile",
                        List.of(
                                "Ticket number | " + detail.ticketNumber(),
                                "Category | " + detail.ticketCategoryName(),
                                "Status | " + toTitleCase(detail.status().name()),
                                "Priority | " + toTitleCase(detail.priority().name()),
                                "Reporter | " + detail.reporterDisplayName() + " (" + detail.reporterEmail() + ")",
                                "Assigned Staff | "
                                        + (detail.assignedStaffDisplayName() == null
                                                ? "Not assigned"
                                                : detail.assignedStaffDisplayName()),
                                "Resource | " + safeValue(detail.resourceName()),
                                "Location | " + resolveDetailScope(detail)),
                        PdfTone.SLATE);
                writer.writeParagraphCard(
                        "Issue narrative",
                        safeValue(detail.description()),
                        PdfTone.SLATE);
                writer.writeCard(
                        "Reporter contact and access details",
                        List.of(
                                "Preferred Contact Name | " + safeValue(detail.preferredContactName()),
                                "Preferred Contact Email | " + safeValue(detail.preferredContactEmail()),
                                "Preferred Contact Phone | " + safeValue(detail.preferredContactPhone()),
                                "Resource category | " + safeValue(detail.resourceCategoryName()),
                                "Location description | " + safeValue(detail.locationDescription())),
                        PdfTone.SKY);
                writer.writeCard(
                        "Lifecycle timeline",
                        List.of(
                                "Created | " + formatDateTime(detail.createdAt()),
                                "Updated | " + formatDateTime(detail.updatedAt()),
                                "First Response | " + formatDateTime(detail.firstRespondedAt()),
                                "Resolved | " + formatDateTime(detail.resolvedAt()),
                                "Rejected | " + formatDateTime(detail.rejectedAt()),
                                "Closed | " + formatDateTime(detail.closedAt())),
                        PdfTone.AMBER);
                writer.writeCard(
                        "Resolution outcome",
                        List.of(
                                "Resolution Summary | " + safeValue(detail.resolutionSummary()),
                                "Rejection Reason | " + safeValue(detail.rejectionReason())),
                        toneForStatus(detail.status()));

                if (detail.assignmentHistory().isEmpty()) {
                    writer.writeParagraphCard(
                            "Assignment history",
                            "No assignment history was recorded for this ticket.",
                            PdfTone.SKY);
                } else {
                    for (TicketAssignmentResponse assignment : detail.assignmentHistory()) {
                        writer.writeCard(
                                "Assignment record  |  " + assignment.assignedToDisplayName(),
                                List.of(
                                        "Assigned By | " + assignment.assignedByDisplayName(),
                                        "Assigned At | " + formatDateTime(assignment.assignedAt()),
                                        "Assignment Note | " + safeValue(assignment.assignmentNote()),
                                        "Assignment Closed | " + formatDateTime(assignment.unassignedAt()),
                                        "Current record | " + (assignment.isActive() ? "Active" : "Historical")),
                                PdfTone.SKY);
                    }
                }

                if (comments.isEmpty()) {
                    writer.writeParagraphCard(
                            "Comments and notes",
                            "No comments or staff notes are attached to this ticket record.",
                            PdfTone.EMERALD);
                } else {
                    for (TicketCommentResponse comment : comments) {
                        writer.writeCard(
                                "Comment entry  |  "
                                        + comment.authorDisplayName()
                                        + "  |  "
                                        + toTitleCase(comment.commentType().name()),
                                List.of(
                                        "Created | " + formatDateTime(comment.createdAt()),
                                        "Edited | " + formatDateTime(comment.editedAt()),
                                        "Comment | " + safeValue(comment.body())),
                                PdfTone.EMERALD);
                    }
                }

                if (attachments.isEmpty()) {
                    writer.writeParagraphCard(
                            "Attachments and evidence",
                            "No image evidence or supporting attachments were uploaded for this ticket.",
                            PdfTone.SLATE);
                } else {
                    writer.writeCard(
                            "Attachments and evidence",
                            attachments.stream()
                                    .map(
                                            attachment ->
                                                    attachment.fileName()
                                                            + " | "
                                                            + safeValue(attachment.mimeType())
                                                            + " | "
                                                            + formatFileSize(attachment.fileSize())
                                                            + " | Uploaded "
                                                            + formatDateTime(attachment.createdAt()))
                                    .toList(),
                            PdfTone.SLATE);
                }
            }

            return new RenderedTicketReport(
                    fileName,
                    "application/pdf",
                    saveDocument(document),
                    1,
                    summaryText);
        } catch (IOException ex) {
            log.warn("Could not render detail PDF report for ticket={}", detail.ticketNumber(), ex);
            throw new IllegalStateException("Could not generate the PDF report.");
        }
    }

    private RenderedTicketReport renderDetailCsv(
            GenerateTicketReportRequest request,
            String filterSummary,
            TicketDetailResponse detail,
            List<TicketCommentResponse> comments,
            List<TicketAttachmentResponse> attachments) {
        String safeTicketNumber =
                detail.ticketNumber().replaceAll("[^A-Za-z0-9_-]+", "_").toLowerCase(Locale.ROOT);
        String fileName = "ticket_%s_detail.csv".formatted(safeTicketNumber);
        String summaryText =
                "Detailed CSV export prepared for ticket %s."
                        .formatted(detail.ticketNumber());

        StringBuilder csv = new StringBuilder();
        csv.append(
                csvLine(
                        "Report Type",
                        "Filters",
                        "Ticket Number",
                        "Title",
                        "Description",
                        "Category",
                        "Priority",
                        "Status",
                        "Reporter",
                        "Reporter Email",
                        "Assigned Staff",
                        "Preferred Contact Name",
                        "Preferred Contact Email",
                        "Preferred Contact Phone",
                        "Resource",
                        "Location",
                        "Resolution Summary",
                        "Rejection Reason",
                        "Created At",
                        "Updated At",
                        "Resolved At",
                        "Rejected At",
                        "Closed At",
                        "Comments",
                        "Attachments"));

        csv.append(
                csvLine(
                        request.reportType().name(),
                        filterSummary,
                        detail.ticketNumber(),
                        detail.title(),
                        detail.description(),
                        detail.ticketCategoryName(),
                        detail.priority().name(),
                        detail.status().name(),
                        detail.reporterDisplayName(),
                        detail.reporterEmail(),
                        safeValue(detail.assignedStaffDisplayName()),
                        safeValue(detail.preferredContactName()),
                        safeValue(detail.preferredContactEmail()),
                        safeValue(detail.preferredContactPhone()),
                        safeValue(detail.resourceName()),
                        resolveDetailScope(detail),
                        safeValue(detail.resolutionSummary()),
                        safeValue(detail.rejectionReason()),
                        formatDateTime(detail.createdAt()),
                        formatDateTime(detail.updatedAt()),
                        formatDateTime(detail.resolvedAt()),
                        formatDateTime(detail.rejectedAt()),
                        formatDateTime(detail.closedAt()),
                        joinComments(comments),
                        joinAttachments(attachments)));

        return new RenderedTicketReport(
                fileName,
                "text/csv",
                csv.toString().getBytes(StandardCharsets.UTF_8),
                1,
                summaryText);
    }

    private byte[] saveDocument(PDDocument document) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        document.save(outputStream);
        return outputStream.toByteArray();
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

    private String joinComments(List<TicketCommentResponse> comments) {
        if (comments.isEmpty()) {
            return "";
        }
        return comments.stream()
                .map(
                        comment ->
                                "[%s] %s: %s"
                                        .formatted(
                                                toTitleCase(comment.commentType().name()),
                                                comment.authorDisplayName(),
                                                comment.body().replaceAll("\\s+", " ").trim()))
                .reduce((left, right) -> left + " | " + right)
                .orElse("");
    }

    private String joinAttachments(List<TicketAttachmentResponse> attachments) {
        if (attachments.isEmpty()) {
            return "";
        }
        return attachments.stream()
                .map(TicketAttachmentResponse::fileName)
                .reduce((left, right) -> left + " | " + right)
                .orElse("");
    }

    private String csvLine(String... values) {
        return String.join(
                        ",",
                        java.util.Arrays.stream(values)
                                .map(this::csvEscape)
                                .toList())
                + System.lineSeparator();
    }

    private String csvEscape(String value) {
        String safe = value == null ? "" : value;
        String escaped = safe.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }

    private String formatDateTime(LocalDateTime value) {
        return value == null ? "" : value.format(TIMESTAMP_FORMATTER);
    }

    private String formatFileSize(Long bytes) {
        if (bytes == null || bytes < 0) {
            return "Unknown size";
        }
        if (bytes < 1024) {
            return bytes + " B";
        }
        if (bytes < 1024 * 1024) {
            return String.format(Locale.ROOT, "%.1f KB", bytes / 1024d);
        }
        return String.format(Locale.ROOT, "%.1f MB", bytes / (1024d * 1024d));
    }

    private String safeValue(String value) {
        return value == null || value.isBlank() ? "Not provided" : value;
    }

    private String toTitleCase(String value) {
        String normalized = value.toLowerCase(Locale.ROOT).replace('_', ' ');
        String[] segments = normalized.split("\\s+");
        StringBuilder result = new StringBuilder();
        for (String segment : segments) {
            if (segment.isBlank()) {
                continue;
            }
            if (!result.isEmpty()) {
                result.append(' ');
            }
            result.append(Character.toUpperCase(segment.charAt(0)));
            if (segment.length() > 1) {
                result.append(segment.substring(1));
            }
        }
        return result.isEmpty() ? normalized : result.toString();
    }

    public record RenderedTicketReport(
            String fileName, String mimeType, byte[] fileData, int recordCount, String summaryText) {}

    private enum PdfTone {
        SLATE(new Color(27, 43, 65), new Color(244, 247, 250), new Color(92, 108, 126)),
        AMBER(new Color(186, 110, 24), new Color(255, 248, 238), new Color(145, 86, 18)),
        SKY(new Color(20, 102, 170), new Color(240, 248, 255), new Color(24, 84, 133)),
        EMERALD(new Color(23, 133, 103), new Color(240, 252, 248), new Color(20, 101, 78));

        private final Color accentColor;
        private final Color surfaceColor;
        private final Color textColor;

        PdfTone(Color accentColor, Color surfaceColor, Color textColor) {
            this.accentColor = accentColor;
            this.surfaceColor = surfaceColor;
            this.textColor = textColor;
        }

        public Color accentColor() {
            return accentColor;
        }

        public Color surfaceColor() {
            return surfaceColor;
        }

        public Color textColor() {
            return textColor;
        }
    }

    record StatItem(String label, String value, PdfTone tone) {}

    private PdfTone toneForStatus(TicketStatus status) {
        return switch (status) {
            case OPEN -> PdfTone.AMBER;
            case IN_PROGRESS -> PdfTone.SKY;
            case RESOLVED -> PdfTone.EMERALD;
            case REJECTED, CLOSED -> PdfTone.SLATE;
        };
    }

    private PdfTone toneForPriority(TicketPriority priority) {
        return switch (priority) {
            case LOW -> PdfTone.SKY;
            case MEDIUM -> PdfTone.AMBER;
            case HIGH, URGENT -> PdfTone.EMERALD;
        };
    }

    private long countByStatus(List<TicketSummaryResponse> tickets, TicketStatus status) {
        return tickets.stream().filter(ticket -> ticket.status() == status).count();
    }

    private static final class PdfWriter implements AutoCloseable {

        private static final float MARGIN = 42f;
        private static final float HEADER_HEIGHT = 64f;
        private static final float BOTTOM_MARGIN = 42f;
        private static final float CONTENT_TOP_SPACING = 26f;
        private static final float BODY_FONT_SIZE = 10.5f;
        private static final float LABEL_FONT_SIZE = 9.25f;
        private static final float TITLE_FONT_SIZE = 22f;
        private static final float SECTION_FONT_SIZE = 13f;
        private static final float LINE_GAP = 14f;
        private static final Color HEADER_COLOR = new Color(20, 32, 47);
        private static final Color HEADER_MUTED = new Color(196, 207, 218);
        private static final Color BORDER_COLOR = new Color(216, 223, 230);
        private static final Color TEXT_COLOR = new Color(34, 46, 58);
        private static final Color MUTED_TEXT_COLOR = new Color(98, 112, 126);
        private static final Color PAGE_BACKGROUND = new Color(250, 251, 252);
        private static final Color FOOTER_COLOR = new Color(119, 132, 146);

        private final PDDocument document;
        private final String title;
        private final String subtitle;
        private final PDType1Font headingFont =
                new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        private final PDType1Font bodyFont =
                new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        private final String generatedTimestamp =
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm", Locale.ROOT));
        private PDPage page;
        private PDPageContentStream stream;
        private float cursorY;
        private int pageNumber = 0;

        private PdfWriter(PDDocument document, String title, String subtitle) throws IOException {
            this.document = document;
            this.title = title;
            this.subtitle = subtitle;
            startNewPage();
        }

        private void ensureSpace(float blockHeight) throws IOException {
            if (cursorY - blockHeight <= BOTTOM_MARGIN + 12f) {
                startNewPage();
            }
        }

        private void startNewPage() throws IOException {
            closeCurrentStream();
            page = new PDPage(PDRectangle.LETTER);
            document.addPage(page);
            stream = new PDPageContentStream(document, page);
            pageNumber++;

            stream.setNonStrokingColor(PAGE_BACKGROUND);
            stream.addRect(0, 0, page.getMediaBox().getWidth(), page.getMediaBox().getHeight());
            stream.fill();

            drawHeader();
            drawFooter();

            cursorY = page.getMediaBox().getHeight() - HEADER_HEIGHT - CONTENT_TOP_SPACING;
        }

        private void drawHeader() throws IOException {
            float pageWidth = page.getMediaBox().getWidth();
            float headerY = page.getMediaBox().getHeight() - HEADER_HEIGHT;

            stream.setNonStrokingColor(HEADER_COLOR);
            stream.addRect(0, headerY, pageWidth, HEADER_HEIGHT);
            stream.fill();

            stream.setNonStrokingColor(Color.WHITE);
            stream.beginText();
            stream.setFont(headingFont, 10f);
            stream.newLineAtOffset(MARGIN, headerY + 44f);
            stream.showText("SMART CAMPUS");
            stream.endText();

            stream.setNonStrokingColor(HEADER_MUTED);
            stream.beginText();
            stream.setFont(bodyFont, 9f);
            stream.newLineAtOffset(MARGIN, headerY + 28f);
            stream.showText("Maintenance and Incident Reporting");
            stream.endText();

            stream.setNonStrokingColor(Color.WHITE);
            stream.beginText();
            stream.setFont(headingFont, 14f);
            stream.newLineAtOffset(pageWidth - MARGIN - 170f, headerY + 40f);
            stream.showText(title);
            stream.endText();

            stream.setNonStrokingColor(HEADER_MUTED);
            stream.beginText();
            stream.setFont(bodyFont, 9f);
            stream.newLineAtOffset(pageWidth - MARGIN - 170f, headerY + 24f);
            stream.showText(subtitle);
            stream.endText();
        }

        private void drawFooter() throws IOException {
            float pageWidth = page.getMediaBox().getWidth();
            float footerY = BOTTOM_MARGIN - 8f;

            stream.setStrokingColor(BORDER_COLOR);
            stream.setLineWidth(0.5f);
            stream.moveTo(MARGIN, footerY + 16f);
            stream.lineTo(pageWidth - MARGIN, footerY + 16f);
            stream.stroke();

            stream.setNonStrokingColor(FOOTER_COLOR);
            stream.beginText();
            stream.setFont(bodyFont, 9f);
            stream.newLineAtOffset(MARGIN, footerY);
            stream.showText("Generated " + generatedTimestamp + "  |  Smart Campus Ticketing");
            stream.endText();

            stream.beginText();
            stream.setFont(bodyFont, 9f);
            stream.newLineAtOffset(pageWidth - MARGIN - 52f, footerY);
            stream.showText("Page " + pageNumber);
            stream.endText();
        }

        private void writeHeroCard(
                String eyebrow, String titleText, String description, List<String> metadata)
                throws IOException {
            float cardWidth = page.getMediaBox().getWidth() - 2 * MARGIN;
            List<String> titleLines = wrapText(titleText, headingFont, TITLE_FONT_SIZE, cardWidth - 36f);
            List<String> descriptionLines =
                    wrapText(description, bodyFont, BODY_FONT_SIZE, cardWidth - 36f);
            List<String> metadataLines = wrapText(String.join("     ", metadata), bodyFont, 9f, cardWidth - 36f);
            float cardHeight =
                    28f
                            + 12f
                            + titleLines.size() * 24f
                            + 10f
                            + descriptionLines.size() * LINE_GAP
                            + 12f
                            + metadataLines.size() * 12f
                            + 16f;

            ensureSpace(cardHeight + 10f);

            float cardX = MARGIN;
            float cardY = cursorY - cardHeight;

            stream.setNonStrokingColor(Color.WHITE);
            stream.addRect(cardX, cardY, cardWidth, cardHeight);
            stream.fill();
            stream.setStrokingColor(BORDER_COLOR);
            stream.setLineWidth(0.9f);
            stream.addRect(cardX, cardY, cardWidth, cardHeight);
            stream.stroke();

            stream.setNonStrokingColor(HEADER_COLOR);
            stream.addRect(cardX, cardY + cardHeight - 12f, cardWidth, 12f);
            stream.fill();

            float textX = cardX + 18f;
            float textY = cardY + cardHeight - 28f;
            drawTextBlock(List.of(eyebrow.toUpperCase(Locale.ROOT)), headingFont, 8.5f, textX, textY, 11f, PdfTone.SKY.textColor());
            textY -= 18f;
            drawTextBlock(titleLines, headingFont, TITLE_FONT_SIZE, textX, textY, 24f, TEXT_COLOR);
            textY -= titleLines.size() * 24f + 2f;
            drawTextBlock(descriptionLines, bodyFont, BODY_FONT_SIZE, textX, textY, LINE_GAP, MUTED_TEXT_COLOR);
            textY -= descriptionLines.size() * LINE_GAP + 10f;
            drawTextBlock(metadataLines, bodyFont, 9f, textX, textY, 12f, new Color(70, 84, 98));

            cursorY = cardY - 16f;
        }

        private void writeStatGrid(List<StatItem> stats) throws IOException {
            int statCount = Math.max(stats.size(), 1);
            float pageWidth = page.getMediaBox().getWidth();
            float statWidth = (pageWidth - 2 * MARGIN - ((statCount - 1) * 10f)) / statCount;
            float statHeight = 72f;
            float statY = cursorY - statHeight;

            ensureSpace(statHeight + 10f);

            for (int i = 0; i < stats.size(); i++) {
                StatItem stat = stats.get(i);
                float statX = MARGIN + i * (statWidth + 10);

                stream.setNonStrokingColor(stat.tone().surfaceColor());
                stream.addRect(statX, statY, statWidth, statHeight);
                stream.fill();
                stream.setStrokingColor(BORDER_COLOR);
                stream.setLineWidth(0.7f);
                stream.addRect(statX, statY, statWidth, statHeight);
                stream.stroke();

                stream.setNonStrokingColor(stat.tone().accentColor());
                stream.addRect(statX, statY + statHeight - 6f, statWidth, 6f);
                stream.fill();

                stream.setNonStrokingColor(MUTED_TEXT_COLOR);
                stream.beginText();
                stream.setFont(headingFont, 8.5f);
                stream.newLineAtOffset(statX + 12, statY + statHeight - 20);
                stream.showText(stat.label());
                stream.endText();

                stream.setNonStrokingColor(TEXT_COLOR);
                stream.beginText();
                stream.setFont(headingFont, 18f);
                stream.newLineAtOffset(statX + 12, statY + statHeight - 48);
                stream.showText(stat.value());
                stream.endText();
            }

            cursorY = statY - 18f;
        }

        private void writeCard(String title, List<String> items, PdfTone tone) throws IOException {
            float pageWidth = page.getMediaBox().getWidth();
            float cardWidth = pageWidth - 2 * MARGIN;
            float cardX = MARGIN;
            float keyWidth = 138f;
            float valueWidth = cardWidth - keyWidth - 40f;
            float bodyY = 0f;
            float totalHeight = 26f;

            List<List<String>> titleLines = List.of(wrapText(title, headingFont, SECTION_FONT_SIZE, cardWidth - 30f));
            totalHeight += titleLines.getFirst().size() * 17f + 12f;

            List<RowLayout> layouts = new ArrayList<>();
            for (String item : items) {
                String key = item;
                String value = "";
                boolean split = item.contains(" | ");
                if (split) {
                    String[] parts = item.split(" \\| ", 2);
                    key = parts[0];
                    value = parts[1];
                }

                List<String> keyLines = wrapText(key, headingFont, LABEL_FONT_SIZE, keyWidth);
                List<String> valueLines =
                        split
                                ? wrapText(value, bodyFont, BODY_FONT_SIZE, valueWidth)
                                : wrapText(key, bodyFont, BODY_FONT_SIZE, cardWidth - 30f);
                float rowHeight =
                        split
                                ? Math.max(keyLines.size() * 11f, valueLines.size() * LINE_GAP)
                                : valueLines.size() * LINE_GAP;
                rowHeight += 10f;
                layouts.add(new RowLayout(split, keyLines, valueLines, rowHeight));
                totalHeight += rowHeight;
            }
            totalHeight += 14f;

            ensureSpace(totalHeight + 10f);

            float cardY = cursorY - totalHeight;
            stream.setNonStrokingColor(tone.surfaceColor());
            stream.addRect(cardX, cardY, cardWidth, totalHeight);
            stream.fill();
            stream.setStrokingColor(BORDER_COLOR);
            stream.setLineWidth(0.75f);
            stream.addRect(cardX, cardY, cardWidth, totalHeight);
            stream.stroke();

            stream.setNonStrokingColor(tone.accentColor());
            stream.addRect(cardX, cardY + totalHeight - 7f, cardWidth, 7f);
            stream.fill();

            float textX = cardX + 15f;
            float textY = cardY + totalHeight - 22f;
            drawTextBlock(titleLines.getFirst(), headingFont, SECTION_FONT_SIZE, textX, textY, 17f, TEXT_COLOR);

            bodyY = textY - titleLines.getFirst().size() * 17f - 10f;
            for (int i = 0; i < layouts.size(); i++) {
                RowLayout layout = layouts.get(i);
                float rowTop = bodyY;
                if (i > 0) {
                    stream.setStrokingColor(new Color(233, 237, 241));
                    stream.setLineWidth(0.5f);
                    stream.moveTo(cardX + 15f, rowTop + 4f);
                    stream.lineTo(cardX + cardWidth - 15f, rowTop + 4f);
                    stream.stroke();
                }

                if (layout.split()) {
                    drawTextBlock(layout.keyLines(), headingFont, LABEL_FONT_SIZE, textX, rowTop - 3f, 11f, tone.textColor());
                    drawTextBlock(
                            layout.valueLines(),
                            bodyFont,
                            BODY_FONT_SIZE,
                            textX + keyWidth + 12f,
                            rowTop - 3f,
                            LINE_GAP,
                            TEXT_COLOR);
                } else {
                    drawTextBlock(layout.valueLines(), bodyFont, BODY_FONT_SIZE, textX, rowTop - 3f, LINE_GAP, TEXT_COLOR);
                }

                bodyY -= layout.height();
            }

            cursorY = cardY - 14f;
        }

        private void writeParagraphCard(String title, String body, PdfTone tone) throws IOException {
            float cardWidth = page.getMediaBox().getWidth() - 2 * MARGIN;
            List<String> titleLines = wrapText(title, headingFont, SECTION_FONT_SIZE, cardWidth - 30f);
            List<String> bodyLines = wrapText(body, bodyFont, BODY_FONT_SIZE, cardWidth - 30f);
            float cardHeight = 28f + titleLines.size() * 17f + 8f + bodyLines.size() * LINE_GAP + 18f;

            ensureSpace(cardHeight + 10f);

            float cardX = MARGIN;
            float cardY = cursorY - cardHeight;

            stream.setNonStrokingColor(tone.surfaceColor());
            stream.addRect(cardX, cardY, cardWidth, cardHeight);
            stream.fill();
            stream.setStrokingColor(BORDER_COLOR);
            stream.setLineWidth(0.75f);
            stream.addRect(cardX, cardY, cardWidth, cardHeight);
            stream.stroke();

            stream.setNonStrokingColor(tone.accentColor());
            stream.addRect(cardX, cardY + cardHeight - 7f, cardWidth, 7f);
            stream.fill();

            float textX = cardX + 15f;
            float textY = cardY + cardHeight - 22f;
            drawTextBlock(titleLines, headingFont, SECTION_FONT_SIZE, textX, textY, 17f, TEXT_COLOR);
            drawTextBlock(
                    bodyLines,
                    bodyFont,
                    BODY_FONT_SIZE,
                    textX,
                    textY - titleLines.size() * 17f - 8f,
                    LINE_GAP,
                    TEXT_COLOR);

            cursorY = cardY - 14f;
        }

        private void drawTextBlock(
                List<String> lines,
                PDFont font,
                float fontSize,
                float x,
                float startY,
                float lineHeight,
                Color color)
                throws IOException {
            stream.setNonStrokingColor(color);
            float textY = startY;
            for (String line : lines) {
                stream.beginText();
                stream.setFont(font, fontSize);
                stream.newLineAtOffset(x, textY);
                stream.showText(line);
                stream.endText();
                textY -= lineHeight;
            }
        }

        private List<String> wrapText(String text, PDFont font, float fontSize, float maxWidth)
                throws IOException {
            String normalized = text == null || text.isBlank() ? " " : text.replace('\n', ' ');
            List<String> lines = new ArrayList<>();
            StringBuilder currentLine = new StringBuilder();

            for (String word : normalized.split("\\s+")) {
                String candidate =
                        currentLine.isEmpty() ? word : currentLine + " " + word;
                float candidateWidth = font.getStringWidth(candidate) / 1000 * fontSize;
                if (candidateWidth > maxWidth && !currentLine.isEmpty()) {
                    lines.add(currentLine.toString());
                    currentLine = new StringBuilder(word);
                } else {
                    currentLine = new StringBuilder(candidate);
                }
            }

            if (!currentLine.isEmpty()) {
                lines.add(currentLine.toString());
            }

            return lines.isEmpty() ? List.of(" ") : lines;
        }

        @Override
        public void close() throws IOException {
            closeCurrentStream();
        }

        private void closeCurrentStream() throws IOException {
            if (stream != null) {
                stream.close();
                stream = null;
            }
        }

        private record RowLayout(
                boolean split, List<String> keyLines, List<String> valueLines, float height) {}
    }
}
