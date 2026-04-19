package com.smartcampus.backend.modules.ticket.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;

import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.common.service.SupabaseStorageService;
import com.smartcampus.backend.modules.ticket.dto.TicketAttachmentResponse;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketAttachment;
import com.smartcampus.backend.modules.ticket.entity.TicketCategory;
import com.smartcampus.backend.modules.ticket.mapper.TicketMapper;
import com.smartcampus.backend.modules.ticket.repository.TicketAttachmentRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class TicketAttachmentServiceTest {

    @Mock private TicketAttachmentRepository ticketAttachmentRepository;
    @Mock private TicketAccessService ticketAccessService;
    @Mock private SupabaseStorageService supabaseStorageService;

    private TicketAttachmentService ticketAttachmentService;

    @BeforeEach
    void setUp() {
        ticketAttachmentService =
                new TicketAttachmentService(
                        ticketAttachmentRepository,
                        ticketAccessService,
                        new TicketMapper(),
                        supabaseStorageService);
        ReflectionTestUtils.setField(
                ticketAttachmentService, "ticketAttachmentsBucket", "ticket-attachments");
    }

    @Test
    void rejectsMoreThanThreeAttachments() {
        User reporter = buildReporter();
        UserRole membership = buildMembership(reporter);
        Ticket ticket = buildTicket(reporter);

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketAttachmentRepository.countByTicket_Id(100L)).thenReturn(3L);

        MultipartFile file =
                new MockMultipartFile("file", "evidence.jpg", "image/jpeg", new byte[] {1, 2, 3});

        assertThatThrownBy(
                        () ->
                                ticketAttachmentService.addAttachment(ticket, "Projector damage", file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at most 3 attachments");
    }

    @Test
    void rejectsNonImageUpload() {
        User reporter = buildReporter();
        UserRole membership = buildMembership(reporter);
        Ticket ticket = buildTicket(reporter);

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketAttachmentRepository.countByTicket_Id(100L)).thenReturn(0L);

        MultipartFile file =
                new MockMultipartFile("file", "evidence.pdf", "application/pdf", new byte[] {1, 2, 3});

        assertThatThrownBy(() -> ticketAttachmentService.addAttachment(ticket, "Evidence", file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only JPG, PNG, WEBP, and GIF images are allowed");
    }

    @Test
    void derivesTitleFromFilenameWhenTitleIsMissing() {
        User reporter = buildReporter();
        UserRole membership = buildMembership(reporter);
        Ticket ticket = buildTicket(reporter);

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketAttachmentRepository.countByTicket_Id(100L)).thenReturn(0L);
        when(ticketAttachmentRepository.save(any(TicketAttachment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        MultipartFile file =
                new MockMultipartFile("file", "projector-damage.jpg", "image/jpeg", new byte[] {1, 2, 3});

        TicketAttachmentResponse response = ticketAttachmentService.addAttachment(ticket, null, file);

        assertThat(response.title()).isEqualTo("projector damage");
        verify(supabaseStorageService)
                .uploadObject(any(String.class), any(String.class), any(byte[].class), any(String.class));
    }

    @Test
    void deletesUploadedObjectWhenMetadataSaveFails() {
        User reporter = buildReporter();
        UserRole membership = buildMembership(reporter);
        Ticket ticket = buildTicket(reporter);

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketAttachmentRepository.countByTicket_Id(100L)).thenReturn(0L);
        when(ticketAttachmentRepository.save(any(TicketAttachment.class)))
                .thenThrow(new RuntimeException("db write failed"));

        MultipartFile file =
                new MockMultipartFile("file", "projector-damage.jpg", "image/jpeg", new byte[] {1, 2, 3});

        assertThatThrownBy(() -> ticketAttachmentService.addAttachment(ticket, null, file))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Could not save the attachment image.");

        verify(supabaseStorageService)
                .uploadObject(
                        eq("ticket-attachments"),
                        any(String.class),
                        any(byte[].class),
                        eq("image/jpeg"));
        verify(supabaseStorageService).deleteObject(eq("ticket-attachments"), any(String.class));
    }

    @Test
    void returnsClearMessageWhenStorageUploadFails() {
        User reporter = buildReporter();
        UserRole membership = buildMembership(reporter);
        Ticket ticket = buildTicket(reporter);

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketAttachmentRepository.countByTicket_Id(100L)).thenReturn(0L);
        when(supabaseStorageService.uploadObject(
                        eq("ticket-attachments"),
                        any(String.class),
                        any(byte[].class),
                        eq("image/jpeg")))
                .thenThrow(new IllegalStateException("bucket not found"));

        MultipartFile file =
                new MockMultipartFile("file", "projector-damage.jpg", "image/jpeg", new byte[] {1, 2, 3});

        assertThatThrownBy(() -> ticketAttachmentService.addAttachment(ticket, null, file))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(
                        "Could not upload the attachment image. Confirm the ticket attachments bucket exists and Supabase storage is configured.");

        verify(ticketAttachmentRepository, never()).save(any(TicketAttachment.class));
    }

    @Test
    void deletesSingleAttachmentFromStorageAndDatabase() {
        User reporter = buildReporter();
        UserRole membership = buildMembership(reporter);
        Ticket ticket = buildTicket(reporter);
        TicketAttachment attachment =
                TicketAttachment.builder()
                        .id(50L)
                        .ticket(ticket)
                        .storageBucket("ticket-attachments")
                        .storagePath("tickets/TCK-100/example.jpg")
                        .build();

        when(ticketAccessService.getRequiredCurrentMembership()).thenReturn(membership);
        when(ticketAttachmentRepository.findByIdAndTicketId(50L, 100L)).thenReturn(java.util.Optional.of(attachment));

        ticketAttachmentService.deleteAttachment(100L, 50L, ticket);

        verify(supabaseStorageService)
                .deleteObject("ticket-attachments", "tickets/TCK-100/example.jpg");
        verify(ticketAttachmentRepository).delete(attachment);
    }

    @Test
    void removesAttachmentRecordsWhenDeletingTicketAttachmentsInBulk() {
        Ticket ticket = Ticket.builder().id(100L).ticketNumber("TCK-100").build();
        TicketAttachment attachment =
                TicketAttachment.builder()
                        .id(50L)
                        .ticket(ticket)
                        .storageBucket("ticket-attachments")
                        .storagePath("tickets/TCK-100/example.jpg")
                        .build();

        when(ticketAttachmentRepository.findByTicketIdOrderByCreatedAtAsc(100L))
                .thenReturn(List.of(attachment));

        ticketAttachmentService.deleteAllForTicket(ticket);

        verify(supabaseStorageService)
                .deleteObject("ticket-attachments", "tickets/TCK-100/example.jpg");
        verify(ticketAttachmentRepository).deleteAll(List.of(attachment));
        verify(ticketAttachmentRepository).flush();
    }

    @Test
    void skipsBatchDeleteWhenNoAttachmentsExistForTicket() {
        Ticket ticket = Ticket.builder().id(100L).ticketNumber("TCK-100").build();
        when(ticketAttachmentRepository.findByTicketIdOrderByCreatedAtAsc(100L)).thenReturn(List.of());

        ticketAttachmentService.deleteAllForTicket(ticket);

        verify(ticketAttachmentRepository, never()).deleteAll(any());
        verify(ticketAttachmentRepository, never()).flush();
    }

    private User buildReporter() {
        return User.builder().id(1L).email("reporter@example.com").status(UserStatus.ACTIVE).build();
    }

    private UserRole buildMembership(User reporter) {
        return UserRole.builder()
                .user(reporter)
                .role(Role.builder().id(1L).code(RoleCode.STUDENT).name("STUDENT").build())
                .isActive(true)
                .build();
    }

    private Ticket buildTicket(User reporter) {
        Ticket ticket =
                Ticket.builder()
                        .id(100L)
                        .ticketNumber("TCK-100")
                        .reporterUser(reporter)
                        .ticketCategory(TicketCategory.builder().id(1L).code("IT").name("IT").build())
                        .title("Issue")
                        .description("Desc")
                        .build();
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        return ticket;
    }
}
