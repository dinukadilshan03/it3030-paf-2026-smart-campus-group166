package com.smartcampus.backend.modules.ticket.service;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.TicketPriority;
import com.smartcampus.backend.common.enums.TicketStatus;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.common.exception.ResourceConflictException;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.modules.notification.service.NotificationService;
import com.smartcampus.backend.modules.resource.entity.Location;
import com.smartcampus.backend.modules.resource.entity.Resource;
import com.smartcampus.backend.modules.resource.service.LocationService;
import com.smartcampus.backend.modules.resource.service.ResourceService;
import com.smartcampus.backend.modules.ticket.dto.CreateTicketRequest;
import com.smartcampus.backend.modules.ticket.dto.RequestTicketReconsiderationRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketAssignmentResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketDetailResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketSummaryResponse;
import com.smartcampus.backend.modules.ticket.dto.UpdateTicketAssignmentRequest;
import com.smartcampus.backend.modules.ticket.dto.UpdateTicketRequest;
import com.smartcampus.backend.modules.ticket.dto.UpdateTicketStatusRequest;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.entity.TicketAssignment;
import com.smartcampus.backend.modules.ticket.entity.TicketCategory;
import com.smartcampus.backend.modules.ticket.mapper.TicketMapper;
import com.smartcampus.backend.modules.ticket.repository.TicketAssignmentRepository;
import com.smartcampus.backend.modules.ticket.repository.TicketRepository;
import com.smartcampus.backend.modules.user.repository.UserRepository;
import com.smartcampus.backend.modules.user.repository.UserRoleRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketAssignmentRepository ticketAssignmentRepository;
    private final TicketCategoryService ticketCategoryService;
    private final TicketCommentService ticketCommentService;
    private final TicketAttachmentService ticketAttachmentService;
    private final ResourceService resourceService;
    private final LocationService locationService;
    private final TicketAccessService ticketAccessService;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final TicketSlaService ticketSlaService;
    private final TicketMapper ticketMapper;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<TicketSummaryResponse> getTickets(
            TicketStatus status, TicketPriority priority, Long ticketCategoryId, String search) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        List<Ticket> tickets =
                switch (membership.getRole().getCode()) {
                    case ADMIN -> ticketRepository.searchAll(
                            status, priority, ticketCategoryId, normalizeSearch(search));
                    case STAFF -> ticketRepository.searchForStaffScope(
                            membership.getUser().getId(),
                            status,
                            priority,
                            ticketCategoryId,
                            normalizeSearch(search));
                    case STUDENT -> ticketRepository.searchForReporter(
                            membership.getUser().getId(),
                            status,
                            priority,
                            ticketCategoryId,
                            normalizeSearch(search));
                };

        return tickets.stream().map(ticketMapper::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public TicketDetailResponse getTicketById(Long id) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        Ticket ticket = getDetailedTicket(id);
        ticketAccessService.ensureCanViewTicket(membership, ticket);

        List<TicketAssignmentResponse> assignments =
                ticketAssignmentRepository.findByTicketIdOrderByAssignedAtDesc(id).stream()
                        .map(ticketMapper::toAssignmentResponse)
                        .toList();

        return ticketMapper.toDetail(ticket, assignments);
    }

    @Transactional
    public TicketDetailResponse create(CreateTicketRequest request) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        User reporter = resolveReporterForCreate(membership, request.reporterUserId());
        TicketCategory category = getActiveCategory(request.ticketCategoryId());
        Resource resource = resolveResource(request.resourceId());
        Location location = resolveConsistentLocation(resource, request.locationId());

        Ticket ticket =
                Ticket.builder()
                        .ticketNumber(generateTicketNumber())
                        .reporterUser(reporter)
                        .resource(resource)
                        .location(location)
                        .ticketCategory(category)
                        .title(request.title().trim())
                        .description(request.description().trim())
                        .priority(request.priority())
                        .status(TicketStatus.OPEN)
                        .preferredContactName(normalizeOptionalText(request.preferredContactName()))
                        .preferredContactEmail(normalizeOptionalText(request.preferredContactEmail()))
                        .preferredContactPhone(normalizeOptionalText(request.preferredContactPhone()))
                        .build();

        Ticket savedTicket = ticketRepository.save(ticket);
        return ticketMapper.toDetail(savedTicket, List.of());
    }

    @Transactional
    public TicketDetailResponse updateTicket(Long id, UpdateTicketRequest request) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        Ticket ticket = getManagedTicket(id);
        validateTicketEditPermission(membership, ticket);

        TicketCategory category = getActiveCategory(request.ticketCategoryId());
        Resource resource = resolveResource(request.resourceId());
        Location location = resolveConsistentLocation(resource, request.locationId());

        ticket.setResource(resource);
        ticket.setLocation(location);
        ticket.setTicketCategory(category);
        ticket.setTitle(request.title().trim());
        ticket.setDescription(request.description().trim());
        ticket.setPriority(request.priority());
        ticket.setPreferredContactName(normalizeOptionalText(request.preferredContactName()));
        ticket.setPreferredContactEmail(normalizeOptionalText(request.preferredContactEmail()));
        ticket.setPreferredContactPhone(normalizeOptionalText(request.preferredContactPhone()));

        ticketRepository.save(ticket);
        ticketCommentService.createSystemStatusNote(ticket, "Ticket details updated", membership.getUser());

        return getTicketById(id);
    }

    @Transactional
    public void deleteTicket(Long id) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        Ticket ticket = getManagedTicket(id);
        validateTicketDeletionPermission(membership, ticket);

        ticketAttachmentService.deleteAllForTicket(ticket);
        ticketRepository.delete(ticket);
    }

    @Transactional
    public TicketDetailResponse updateAssignment(Long id, UpdateTicketAssignmentRequest request) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        if (membership.getRole().getCode() != RoleCode.ADMIN) {
            throw new AccessDeniedException("Only admins can assign tickets");
        }

        Ticket ticket = getManagedTicket(id);
        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new IllegalArgumentException("Closed tickets cannot be assigned");
        }

        User assignedUser = validateAssignedStaff(request.assignedStaffUserId());
        TicketAssignment activeAssignment = ticketAssignmentRepository.findActiveByTicketId(id).orElse(null);
        boolean wasRejected = ticket.getStatus() == TicketStatus.REJECTED;

        if (activeAssignment != null && activeAssignment.getAssignedToUser().getId().equals(assignedUser.getId())) {
            return getTicketById(id);
        }

        if (activeAssignment != null) {
            activeAssignment.setIsActive(false);
            activeAssignment.setUnassignedAt(LocalDateTime.now());
            ticketAssignmentRepository.save(activeAssignment);
        }

        ticket.setAssignedStaffUser(assignedUser);
        if (wasRejected) {
            ticket.setStatus(TicketStatus.OPEN);
            ticket.setResolvedAt(null);
            ticket.setClosedAt(null);
            ticket.setReconsiderationReviewedAt(LocalDateTime.now());
        }
        incrementAdminReviewCount(ticket);
        ticketSlaService.markFirstResponseIfNeeded(ticket);
        ticketRepository.save(ticket);

        TicketAssignment newAssignment =
                TicketAssignment.builder()
                        .ticket(ticket)
                        .assignedToUser(assignedUser)
                        .assignedByUser(membership.getUser())
                        .assignmentNote(normalizeOptionalText(request.assignmentNote()))
                        .isActive(true)
                        .build();
        ticketAssignmentRepository.save(newAssignment);

        String noteBody =
                wasRejected
                        ? "Rejected ticket reopened for reconsideration and assigned to "
                                + resolveDisplayName(assignedUser)
                        : activeAssignment == null
                                ? "Ticket assigned to " + resolveDisplayName(assignedUser)
                                : "Ticket reassigned from "
                                        + resolveDisplayName(activeAssignment.getAssignedToUser())
                                        + " to "
                                        + resolveDisplayName(assignedUser);
        ticketCommentService.createSystemStatusNote(ticket, noteBody, membership.getUser());

        return getTicketById(id);
    }

    @Transactional(readOnly = true)
    public Ticket getDetailedTicketEntity(Long id) {
        return getDetailedTicket(id);
    }

    @Transactional(readOnly = true)
    public Ticket getManagedTicketEntity(Long id) {
        return getManagedTicket(id);
    }

    private Location resolveConsistentLocation(Resource resource, Long locationId) {
        if (resource == null && locationId == null) {
            throw new IllegalArgumentException("At least one of resourceId or locationId is required");
        }
        if (resource != null && locationId == null) {
            return resource.getLocation();
        }

        Location location = locationService.getManagedLocation(locationId);
        if (resource != null && !resource.getLocation().getId().equals(location.getId())) {
            throw new ResourceConflictException("Resource and location must refer to the same location");
        }
        return location;
    }

    private Resource resolveResource(Long resourceId) {
        return resourceId == null ? null : resourceService.getManagedResource(resourceId);
    }

    private TicketCategory getActiveCategory(Long categoryId) {
        TicketCategory category = ticketCategoryService.getManagedCategory(categoryId);
        if (!Boolean.TRUE.equals(category.getIsActive())) {
            throw new IllegalArgumentException("Ticket category must be active");
        }
        return category;
    }

    private User resolveReporterForCreate(UserRole membership, Long reporterUserId) {
        if (membership.getRole().getCode() == RoleCode.ADMIN) {
            if (reporterUserId == null) {
                throw new IllegalArgumentException("Reporter selection is required for admin-created tickets");
            }
            return validateReporterUser(reporterUserId);
        }

        if (reporterUserId != null && !reporterUserId.equals(membership.getUser().getId())) {
            throw new AccessDeniedException("You cannot create tickets on behalf of another user");
        }

        return membership.getUser();
    }

    private User validateAssignedStaff(Long userId) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found for id: " + userId));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Assigned staff user must be active");
        }

        UserRole activeRole =
                userRoleRepository
                        .findActiveByUserId(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Active role not found for user id: " + userId));
        if (activeRole.getRole().getCode() != RoleCode.STAFF) {
            throw new IllegalArgumentException("Assigned user must have an active STAFF role");
        }
        return user;
    }

    private User validateReporterUser(Long userId) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found for id: " + userId));
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Reported user must be active");
        }

        UserRole activeRole =
                userRoleRepository
                        .findActiveByUserId(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Active role not found for user id: " + userId));
        if (activeRole.getRole().getCode() != RoleCode.STUDENT
                && activeRole.getRole().getCode() != RoleCode.STAFF) {
            throw new IllegalArgumentException("Reporter must have an active STUDENT or STAFF role");
        }
        return user;
    }

    private void validateTicketEditPermission(UserRole membership, Ticket ticket) {
        if (membership.getRole().getCode() == RoleCode.ADMIN) {
            return;
        }
        if (ticket.getReporterUser().getId().equals(membership.getUser().getId())
                && ticket.getStatus() == TicketStatus.OPEN) {
            return;
        }
        throw new AccessDeniedException("Only admins or the reporter of an open ticket can edit it");
    }

    private void validateTicketDeletionPermission(UserRole membership, Ticket ticket) {
        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new IllegalArgumentException("Only open tickets can be withdrawn or deleted");
        }
        if (membership.getRole().getCode() == RoleCode.ADMIN) {
            return;
        }
        if (ticket.getReporterUser().getId().equals(membership.getUser().getId())) {
            return;
        }
        throw new AccessDeniedException("Only admins or the original reporter can withdraw this ticket");
    }

    private void validateStatusPermission(UserRole membership, Ticket ticket, TicketStatus targetStatus) {
        if (membership.getRole().getCode() == RoleCode.ADMIN) {
            if (targetStatus == TicketStatus.REJECTED || targetStatus == TicketStatus.CLOSED) {
                return;
            }
            throw new AccessDeniedException("Admins can only reject tickets or close resolved work");
        }
        if (membership.getRole().getCode() != RoleCode.STAFF
                || ticket.getAssignedStaffUser() == null
                || !ticket.getAssignedStaffUser().getId().equals(membership.getUser().getId())) {
            throw new AccessDeniedException("You do not have permission to update this ticket");
        }
        if (targetStatus == TicketStatus.REJECTED || targetStatus == TicketStatus.CLOSED) {
            throw new AccessDeniedException("Only admins can reject or close tickets");
        }
    }

    @Transactional
    public TicketDetailResponse updateStatus(Long id, UpdateTicketStatusRequest request) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        Ticket ticket = getManagedTicket(id);
        validateStatusPermission(membership, ticket, request.status());
        validateStatusTransition(ticket.getStatus(), request.status());
        TicketAssignment activeAssignment = ticketAssignmentRepository.findActiveByTicketId(id).orElse(null);
        User assignedStaffSnapshot = ticket.getAssignedStaffUser();

        switch (request.status()) {
            case IN_PROGRESS -> {
                ticket.setRejectionReason(null);
                ticket.setRejectedAt(null);
                incrementStaffReviewCount(ticket);
            }
            case RESOLVED -> {
                if (request.resolutionSummary() == null || request.resolutionSummary().isBlank()) {
                    throw new IllegalArgumentException("Resolution summary is required when resolving a ticket");
                }
                ticket.setResolutionSummary(request.resolutionSummary().trim());
                ticket.setResolvedAt(LocalDateTime.now());
                ticket.setRejectionReason(null);
                ticket.setRejectedAt(null);
                ticket.setClosedAt(null);
                incrementStaffReviewCount(ticket);
            }
            case CLOSED -> {
                ticket.setClosedAt(LocalDateTime.now());
                incrementAdminReviewCount(ticket);
            }
            case REJECTED -> {
                if (request.rejectionReason() == null || request.rejectionReason().isBlank()) {
                    throw new IllegalArgumentException("Rejection reason is required when rejecting a ticket");
                }
                ticket.setRejectionReason(request.rejectionReason().trim());
                ticket.setRejectedAt(LocalDateTime.now());
                ticket.setResolutionSummary(null);
                ticket.setResolvedAt(null);
                ticket.setClosedAt(null);
                ticket.setReconsiderationNote(null);
                ticket.setReconsiderationRequestedAt(null);
                ticket.setReconsiderationReviewedAt(null);
                incrementAdminReviewCount(ticket);
            }
            case OPEN -> {
            }
        }

        if (activeAssignment != null
                && (request.status() == TicketStatus.CLOSED || request.status() == TicketStatus.REJECTED)) {
            activeAssignment.setIsActive(false);
            activeAssignment.setUnassignedAt(LocalDateTime.now());
            ticketAssignmentRepository.save(activeAssignment);
        }

        ticketSlaService.markFirstResponseIfNeeded(ticket);
        ticket.setStatus(request.status());
        ticketRepository.save(ticket);

        ticketCommentService.createSystemStatusNote(
                ticket,
                "Ticket status changed to " + request.status().name().replace('_', ' '),
                membership.getUser());
        notificationService.notifyTicketStatusChanged(
                ticket, request.status(), membership.getUser(), assignedStaffSnapshot);

        return getTicketById(id);
    }

    @Transactional
    public TicketDetailResponse requestReconsideration(Long id, RequestTicketReconsiderationRequest request) {
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        Ticket ticket = getManagedTicket(id);

        if (ticket.getStatus() != TicketStatus.REJECTED) {
            throw new IllegalArgumentException("Only rejected tickets can be submitted for reconsideration");
        }
        if (!ticket.getReporterUser().getId().equals(membership.getUser().getId())) {
            throw new AccessDeniedException(
                    "Only the original reporter can ask admin to reconsider a rejected ticket");
        }

        ticket.setReconsiderationNote(request.note().trim());
        ticket.setReconsiderationRequestedAt(LocalDateTime.now());
        ticket.setReconsiderationReviewedAt(null);
        ticket.setReconsiderationRequestCount(defaultCount(ticket.getReconsiderationRequestCount()) + 1);
        ticketRepository.save(ticket);

        ticketCommentService.createSystemStatusNote(
                ticket, "Reporter requested reconsideration review", membership.getUser());

        return getTicketById(id);
    }

    private void validateStatusTransition(TicketStatus currentStatus, TicketStatus nextStatus) {
        boolean validTransition =
                switch (currentStatus) {
                    case OPEN -> nextStatus == TicketStatus.IN_PROGRESS || nextStatus == TicketStatus.REJECTED;
                    case IN_PROGRESS -> nextStatus == TicketStatus.RESOLVED;
                    case RESOLVED -> nextStatus == TicketStatus.CLOSED;
                    case CLOSED, REJECTED -> false;
                };
        if (!validTransition) {
            throw new IllegalArgumentException(
                    "Invalid ticket status transition from " + currentStatus + " to " + nextStatus);
        }
    }

    private Ticket getManagedTicket(Long id) {
        return ticketRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found for id: " + id));
    }

    private Ticket getDetailedTicket(Long id) {
        return ticketRepository
                .findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found for id: " + id));
    }

    private String generateTicketNumber() {
        String candidate;
        do {
            candidate =
                    "TCK-"
                            + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss", Locale.ROOT))
                            + "-"
                            + UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
        } while (ticketRepository.existsByTicketNumber(candidate));
        return candidate;
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        return search.trim().toLowerCase(Locale.ROOT);
    }

    private String resolveDisplayName(User user) {
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName();
        }
        return user.getEmail();
    }

    private void incrementStaffReviewCount(Ticket ticket) {
        ticket.setStaffReviewCount(defaultCount(ticket.getStaffReviewCount()) + 1);
    }

    private void incrementAdminReviewCount(Ticket ticket) {
        ticket.setAdminReviewCount(defaultCount(ticket.getAdminReviewCount()) + 1);
    }

    private int defaultCount(Integer value) {
        return value == null ? 0 : value;
    }
}
