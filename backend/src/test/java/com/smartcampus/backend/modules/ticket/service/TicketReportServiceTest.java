package com.smartcampus.backend.modules.ticket.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.TicketPriority;
import com.smartcampus.backend.common.enums.TicketReportFormat;
import com.smartcampus.backend.common.enums.TicketReportStatus;
import com.smartcampus.backend.common.enums.TicketReportType;
import com.smartcampus.backend.common.enums.TicketStatus;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.modules.resource.service.LocationService;
import com.smartcampus.backend.modules.resource.service.ResourceService;
import com.smartcampus.backend.modules.ticket.dto.GenerateTicketReportRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketSummaryResponse;
import com.smartcampus.backend.modules.ticket.entity.TicketReport;
import com.smartcampus.backend.modules.ticket.repository.TicketReportRepository;
import com.smartcampus.backend.modules.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
class TicketReportServiceTest {

    @Mock private TicketReportRepository ticketReportRepository;
    @Mock private TicketReportDocumentService ticketReportDocumentService;
    @Mock private TicketService ticketService;
    @Mock private TicketCommentService ticketCommentService;
    @Mock private TicketAttachmentService ticketAttachmentService;
    @Mock private TicketAccessService ticketAccessService;
    @Mock private TicketCategoryService ticketCategoryService;
    @Mock private LocationService locationService;
    @Mock private ResourceService resourceService;
    @Mock private UserRepository userRepository;

    private TicketReportService ticketReportService;

    @BeforeEach
    void setUp() {
        ticketReportService =
                new TicketReportService(
                        ticketReportRepository,
                        ticketReportDocumentService,
                        ticketService,
                        ticketCommentService,
                        ticketAttachmentService,
                        ticketAccessService,
                        ticketCategoryService,
                        locationService,
                        resourceService,
                        userRepository,
                        new ObjectMapper());
    }

    @Test
    void adminOnlySeesOwnGeneratedReports() {
        User admin = buildUser(1L, "admin@example.com", "Admin");
        UserRole membership = buildMembership(admin, RoleCode.ADMIN);
        TicketReport adminReport = buildSummaryReport(10L, admin);

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketReportRepository.findByGeneratedByUserIdOrderByGeneratedAtDesc(1L))
                .thenReturn(List.of(adminReport));

        var reports = ticketReportService.getReports();

        assertThat(reports).hasSize(1);
        assertThat(reports.getFirst().generatedByUserId()).isEqualTo(1L);
        verify(ticketReportRepository).findByGeneratedByUserIdOrderByGeneratedAtDesc(1L);
    }

    @Test
    void adminCannotDownloadStudentGeneratedReport() {
        User admin = buildUser(1L, "admin@example.com", "Admin");
        User student = buildUser(2L, "student@example.com", "Student");
        UserRole membership = buildMembership(admin, RoleCode.ADMIN);
        TicketReport studentReport = buildSummaryReport(11L, student);

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketReportRepository.findDetailedById(11L)).thenReturn(Optional.of(studentReport));

        assertThatThrownBy(() -> ticketReportService.downloadReport(11L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("permission to access this report");
    }

    @Test
    void summaryReportIgnoresSingleTicketFieldsAndIncludesAllMatchingTickets() {
        User admin = buildUser(1L, "admin@example.com", "Admin");
        UserRole membership = buildMembership(admin, RoleCode.ADMIN);
        GenerateTicketReportRequest request =
                new GenerateTicketReportRequest(
                        99L,
                        "TCK-20260418-ONLYONE",
                        TicketReportType.SUMMARY,
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
        TicketSummaryResponse resolvedTicket =
                buildSummaryTicket(10L, "TCK-20260418-AAAAAA", TicketStatus.RESOLVED);
        TicketSummaryResponse closedTicket =
                buildSummaryTicket(11L, "TCK-20260418-BBBBBB", TicketStatus.CLOSED);
        TicketReportDocumentService.RenderedTicketReport renderedReport =
                new TicketReportDocumentService.RenderedTicketReport(
                        "ticket-summary.pdf",
                        "application/pdf",
                        new byte[] {1, 2, 3},
                        2,
                        "Summary report");

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketService.getTickets(null, null, null, null))
                .thenReturn(List.of(resolvedTicket, closedTicket));
        when(ticketReportDocumentService.renderSummaryReport(
                        eq(request), eq("Admin"), anyString(), anyList()))
                .thenReturn(renderedReport);
        when(ticketReportRepository.save(any(TicketReport.class)))
                .thenAnswer(
                        invocation -> {
                            TicketReport report = invocation.getArgument(0);
                            report.setId(12L);
                            return report;
                        });

        var response = ticketReportService.generateReport(request);

        ArgumentCaptor<List<TicketSummaryResponse>> ticketCaptor = ArgumentCaptor.forClass(List.class);
        ArgumentCaptor<String> filterSummaryCaptor = ArgumentCaptor.forClass(String.class);
        verify(ticketService).getTickets(null, null, null, null);
        verify(ticketReportDocumentService)
                .renderSummaryReport(eq(request), eq("Admin"), filterSummaryCaptor.capture(), ticketCaptor.capture());

        assertThat(ticketCaptor.getValue()).containsExactly(resolvedTicket, closedTicket);
        assertThat(filterSummaryCaptor.getValue()).doesNotContain("Ticket ID").doesNotContain("Ticket number");
        assertThat(response.recordCount()).isEqualTo(2);
    }

    private User buildUser(Long id, String email, String displayName) {
        return User.builder().id(id).email(email).displayName(displayName).status(UserStatus.ACTIVE).build();
    }

    private UserRole buildMembership(User user, RoleCode roleCode) {
        return UserRole.builder()
                .user(user)
                .role(Role.builder().id(1L).code(roleCode).name(roleCode.name()).build())
                .isActive(true)
                .build();
    }

    private TicketReport buildSummaryReport(Long id, User generator) {
        return TicketReport.builder()
                .id(id)
                .generatedByUser(generator)
                .reportType(TicketReportType.SUMMARY)
                .format(TicketReportFormat.PDF)
                .status(TicketReportStatus.READY)
                .recordCount(3)
                .fileName("ticket-summary.pdf")
                .mimeType("application/pdf")
                .summaryText("Summary report")
                .fileData(new byte[] {1, 2, 3})
                .generatedAt(LocalDateTime.now())
                .build();
    }

    private TicketSummaryResponse buildSummaryTicket(Long id, String ticketNumber, TicketStatus status) {
        LocalDateTime now = LocalDateTime.now();
        return new TicketSummaryResponse(
                id,
                ticketNumber,
                20L,
                "Student User",
                30L,
                "Staff User",
                null,
                null,
                40L,
                "Lab 1",
                50L,
                "AV",
                "AV Equipment",
                "Ticket " + id,
                TicketPriority.MEDIUM,
                status,
                now.minusDays(2),
                now.minusDays(1),
                now.minusDays(2),
                status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED ? now.minusHours(5) : null,
                0,
                0,
                0);
    }
}
