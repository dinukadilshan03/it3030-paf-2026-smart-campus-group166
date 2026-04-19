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

    // Repository for main ticket data access
    private final TicketRepository ticketRepository;

    // Repository for ticket assignment history
    private final TicketAssignmentRepository ticketAssignmentRepository;

    // Service for ticket category lookup and validation
    private final TicketCategoryService ticketCategoryService;

    // Service for ticket comment operations
    private final TicketCommentService ticketCommentService;

    // Service for attachment cleanup and handling
    private final TicketAttachmentService ticketAttachmentService;

    // Service for resource lookup and validation
    private final ResourceService resourceService;

    // Service for location lookup and validation
    private final LocationService locationService;

    // Handles role-based access control for tickets
    private final TicketAccessService ticketAccessService;

    // Repository for user lookup
    private final UserRepository userRepository;

    // Repository for active user roles
    private final UserRoleRepository userRoleRepository;

    // Service for SLA timestamp updates
    private final TicketSlaService ticketSlaService;

    // Mapper for converting entities to DTOs
    private final TicketMapper ticketMapper;

    // Service for sending notifications
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<TicketSummaryResponse> getTickets(
            TicketStatus status, TicketPriority priority, Long ticketCategoryId, String search) {
        // Get the current logged-in user's active membership
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();

        // Load tickets based on the user's role and scope
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

        // Convert ticket entities to summary DTOs
        return tickets.stream().map(ticketMapper::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public TicketDetailResponse getTicketById(Long id) {
        // Get current user's membership and load full ticket details
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        Ticket ticket = getDetailedTicket(id);

        // Ensure the current user is allowed to view this ticket
        ticketAccessService.ensureCanViewTicket(membership, ticket);

        // Load assignment history for this ticket
        List<TicketAssignmentResponse> assignments =
                ticketAssignmentRepository.findByTicketIdOrderByAssignedAtDesc(id).stream()
                        .map(ticketMapper::toAssignmentResponse)
                        .toList();

        // Convert ticket and assignment history into detail response
        return ticketMapper.toDetail(ticket, assignments);
    }

    @Transactional
    public TicketDetailResponse create(CreateTicketRequest request) {
        // Get current user's membership
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();

        // Admins are not allowed to create tickets
        if (membership.getRole().getCode() == RoleCode.ADMIN) {
            throw new AccessDeniedException("Admins cannot create tickets");
        }

        // Resolve and validate request data
        User reporter = resolveReporterForCreate(membership, request.reporterUserId());
        TicketCategory category = getActiveCategory(request.ticketCategoryId());
        Resource resource = resolveResource(request.resourceId());
        Location location = resolveConsistentLocation(resource, request.locationId());

        // Build the new ticket entity
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

        // Save and return the created ticket
        Ticket savedTicket = ticketRepository.save(ticket);
        notificationService.notifyTicketCreated(savedTicket);
        return ticketMapper.toDetail(savedTicket, List.of());
    }

    @Transactional
    public TicketDetailResponse updateTicket(Long id, UpdateTicketRequest request) {
        // Load current user and ticket
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        Ticket ticket = getManagedTicket(id);

        // Ensure the current user can edit this ticket
        validateTicketEditPermission(membership, ticket);

        // Resolve and validate related objects
        TicketCategory category = getActiveCategory(request.ticketCategoryId());
        Resource resource = resolveResource(request.resourceId());
        Location location = resolveConsistentLocation(resource, request.locationId());

        // Update ticket fields
        ticket.setResource(resource);
        ticket.setLocation(location);
        ticket.setTicketCategory(category);
        ticket.setTitle(request.title().trim());
        ticket.setDescription(request.description().trim());
        ticket.setPriority(request.priority());
        ticket.setPreferredContactName(normalizeOptionalText(request.preferredContactName()));
        ticket.setPreferredContactEmail(normalizeOptionalText(request.preferredContactEmail()));
        ticket.setPreferredContactPhone(normalizeOptionalText(request.preferredContactPhone()));

        // Save ticket and add a system note
        ticketRepository.save(ticket);
        ticketCommentService.createSystemStatusNote(ticket, "Ticket details updated", membership.getUser());

        return getTicketById(id);
    }

    @Transactional
    public void deleteTicket(Long id) {
        // Load current user and target ticket
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        Ticket ticket = getManagedTicket(id);

        // Validate whether the user can delete this ticket
        validateTicketDeletionPermission(membership, ticket);

        // Remove all attachments first, then delete the ticket
        ticketAttachmentService.deleteAllForTicket(ticket);
        ticketRepository.delete(ticket);
    }

    @Transactional
    public TicketDetailResponse updateAssignment(Long id, UpdateTicketAssignmentRequest request) {
        // Only admins are allowed to assign tickets
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        if (membership.getRole().getCode() != RoleCode.ADMIN) {
            throw new AccessDeniedException("Only admins can assign tickets");
        }

        Ticket ticket = getManagedTicket(id);

        // Closed tickets cannot be assigned
        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new IllegalArgumentException("Closed tickets cannot be assigned");
        }

        // Validate the selected staff member
        User assignedUser = validateAssignedStaff(request.assignedStaffUserId());
        TicketAssignment activeAssignment = ticketAssignmentRepository.findActiveByTicketId(id).orElse(null);
        boolean wasRejected = ticket.getStatus() == TicketStatus.REJECTED;

        // If already assigned to the same user, return current state
        if (activeAssignment != null && activeAssignment.getAssignedToUser().getId().equals(assignedUser.getId())) {
            return getTicketById(id);
        }

        // Close previous active assignment if present
        if (activeAssignment != null) {
            activeAssignment.setIsActive(false);
            activeAssignment.setUnassignedAt(LocalDateTime.now());
            ticketAssignmentRepository.save(activeAssignment);
        }

        // Update ticket assignment and reopen if it was rejected for reconsideration
        ticket.setAssignedStaffUser(assignedUser);
        if (wasRejected) {
            ticket.setStatus(TicketStatus.OPEN);
            ticket.setResolvedAt(null);
            ticket.setClosedAt(null);
            ticket.setReconsiderationReviewedAt(LocalDateTime.now());
        }

        // Track admin review and SLA response
        incrementAdminReviewCount(ticket);
        ticketSlaService.markFirstResponseIfNeeded(ticket);
        ticketRepository.save(ticket);

        // Create a new active assignment record
        TicketAssignment newAssignment =
                TicketAssignment.builder()
                        .ticket(ticket)
                        .assignedToUser(assignedUser)
                        .assignedByUser(membership.getUser())
                        .assignmentNote(normalizeOptionalText(request.assignmentNote()))
                        .isActive(true)
                        .build();
        ticketAssignmentRepository.save(newAssignment);

        // Record a system note about what happened
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
        notificationService.notifyTicketAssigned(
                ticket,
                membership.getUser(),
                activeAssignment == null ? null : activeAssignment.getAssignedToUser());

        return getTicketById(id);
    }

    @Transactional(readOnly = true)
    public Ticket getDetailedTicketEntity(Long id) {
        // Return full ticket entity with detailed fetch strategy
        return getDetailedTicket(id);
    }

    @Transactional(readOnly = true)
    public Ticket getManagedTicketEntity(Long id) {
        // Return basic managed ticket entity
        return getManagedTicket(id);
    }

    private Location resolveConsistentLocation(Resource resource, Long locationId) {
        // At least one of resource or location must be present
        if (resource == null && locationId == null) {
            throw new IllegalArgumentException("At least one of resourceId or locationId is required");
        }

        // If only resource exists, use its location
        if (resource != null && locationId == null) {
            return resource.getLocation();
        }

        // Load the location and ensure it matches the resource if both are provided
        Location location = locationService.getManagedLocation(locationId);
        if (resource != null && !resource.getLocation().getId().equals(location.getId())) {
            throw new ResourceConflictException("Resource and location must refer to the same location");
        }
        return location;
    }

    private Resource resolveResource(Long resourceId) {
        // Return null if resource is not provided, otherwise validate and load it
        return resourceId == null ? null : resourceService.getManagedResource(resourceId);
    }

    private TicketCategory getActiveCategory(Long categoryId) {
        // Load category and ensure it is active
        TicketCategory category = ticketCategoryService.getManagedCategory(categoryId);
        if (!Boolean.TRUE.equals(category.getIsActive())) {
            throw new IllegalArgumentException("Ticket category must be active");
        }
        return category;
    }

    private User resolveReporterForCreate(UserRole membership, Long reporterUserId) {
        // Users cannot create tickets on behalf of others
        if (reporterUserId != null && !reporterUserId.equals(membership.getUser().getId())) {
            throw new AccessDeniedException("You cannot create tickets on behalf of another user");
        }

        return membership.getUser();
    }

    private User validateAssignedStaff(Long userId) {
        // Load the user and ensure they exist
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found for id: " + userId));

        // Only active users can be assigned
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Assigned staff user must be active");
        }

        // Ensure the user has an active STAFF role
        UserRole activeRole =
                userRoleRepository
                        .findActiveByUserId(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Active role not found for user id: " + userId));
        if (activeRole.getRole().getCode() != RoleCode.STAFF) {
            throw new IllegalArgumentException("Assigned user must have an active STAFF role");
        }
        return user;
    }

    private void validateTicketEditPermission(UserRole membership, Ticket ticket) {
        // Admins are view-only in this flow
        if (membership.getRole().getCode() == RoleCode.ADMIN) {
            throw new AccessDeniedException("Admins can only view tickets; direct ticket editing is not allowed");
        }

        // Reporter may edit only if the ticket is still open
        if (ticket.getReporterUser().getId().equals(membership.getUser().getId())
                && ticket.getStatus() == TicketStatus.OPEN) {
            return;
        }

        throw new AccessDeniedException("Only admins or the reporter of an open ticket can edit it");
    }

    private void validateTicketDeletionPermission(UserRole membership, Ticket ticket) {
        // Only open tickets can be deleted
        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new IllegalArgumentException("Only open tickets can be withdrawn or deleted");
        }

        // Admins are not allowed to delete tickets
        if (membership.getRole().getCode() == RoleCode.ADMIN) {
            throw new AccessDeniedException("Admins cannot delete tickets");
        }

        // Only the original reporter can delete their open ticket
        if (ticket.getReporterUser().getId().equals(membership.getUser().getId())) {
            return;
        }

        throw new AccessDeniedException("Only the original reporter can withdraw this ticket");
    }

    private void validateStatusPermission(UserRole membership, Ticket ticket, TicketStatus targetStatus) {
        // Admins may only reject tickets or close resolved work
        if (membership.getRole().getCode() == RoleCode.ADMIN) {
            if (targetStatus == TicketStatus.REJECTED || targetStatus == TicketStatus.CLOSED) {
                return;
            }
            throw new AccessDeniedException("Admins can only reject tickets or close resolved work");
        }

        // Staff must be assigned to the ticket to update it
        if (membership.getRole().getCode() != RoleCode.STAFF
                || ticket.getAssignedStaffUser() == null
                || !ticket.getAssignedStaffUser().getId().equals(membership.getUser().getId())) {
            throw new AccessDeniedException("You do not have permission to update this ticket");
        }

        // Staff cannot reject or close tickets
        if (targetStatus == TicketStatus.REJECTED || targetStatus == TicketStatus.CLOSED) {
            throw new AccessDeniedException("Only admins can reject or close tickets");
        }
    }

    @Transactional
    public TicketDetailResponse updateStatus(Long id, UpdateTicketStatusRequest request) {
        // Load current user and ticket
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        Ticket ticket = getManagedTicket(id);

        // Validate permission and transition rules
        validateStatusPermission(membership, ticket, request.status());
        TicketStatus previousStatus = ticket.getStatus();
        validateStatusTransition(ticket, request.status());

        // Snapshot assignment state before mutation
        TicketAssignment activeAssignment = ticketAssignmentRepository.findActiveByTicketId(id).orElse(null);
        User assignedStaffSnapshot = ticket.getAssignedStaffUser();

        switch (request.status()) {
            case IN_PROGRESS -> {
                // Clear rejection info and count staff review
                ticket.setRejectionReason(null);
                ticket.setRejectedAt(null);
                incrementStaffReviewCount(ticket);
            }
            case RESOLVED -> {
                // Resolution summary is required when resolving
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
                // Mark the ticket as closed and count admin review
                ticket.setClosedAt(LocalDateTime.now());
                incrementAdminReviewCount(ticket);
            }
            case REJECTED -> {
                // Rejection reason is required
                if (request.rejectionReason() == null || request.rejectionReason().isBlank()) {
                    throw new IllegalArgumentException("Rejection reason is required when rejecting a ticket");
                }
                ticket.setRejectionReason(request.rejectionReason().trim());
                ticket.setRejectedAt(LocalDateTime.now());
                ticket.setResolutionSummary(null);
                ticket.setResolvedAt(null);
                ticket.setClosedAt(null);

                // Handle repeated rejection after reconsideration request
                if (previousStatus == TicketStatus.REJECTED) {
                    if (!hasPendingReconsiderationRequest(ticket)) {
                        throw new IllegalArgumentException(
                                "Only pending reconsideration requests can be rejected again");
                    }
                    ticket.setReconsiderationReviewedAt(LocalDateTime.now());
                } else {
                    ticket.setReconsiderationNote(null);
                    ticket.setReconsiderationRequestedAt(null);
                    ticket.setReconsiderationReviewedAt(null);
                }
                incrementAdminReviewCount(ticket);
            }
            case OPEN -> {
                // No extra action needed here because OPEN is controlled through transition rules
            }
        }

        // End active assignment when ticket is closed or rejected
        if (activeAssignment != null
                && (request.status() == TicketStatus.CLOSED || request.status() == TicketStatus.REJECTED)) {
            activeAssignment.setIsActive(false);
            activeAssignment.setUnassignedAt(LocalDateTime.now());
            ticketAssignmentRepository.save(activeAssignment);
        }

        // Update SLA, save status, and create a system note
        ticketSlaService.markFirstResponseIfNeeded(ticket);
        ticket.setStatus(request.status());
        ticketRepository.save(ticket);

        String statusNote =
                previousStatus == TicketStatus.REJECTED && request.status() == TicketStatus.REJECTED
                        ? "Reconsideration request reviewed and rejected"
                        : "Ticket status changed to " + request.status().name().replace('_', ' ');
        ticketCommentService.createSystemStatusNote(
                ticket, statusNote, membership.getUser());

        // Notify relevant users about the status change
        notificationService.notifyTicketStatusChanged(
                ticket, request.status(), membership.getUser(), assignedStaffSnapshot);

        return getTicketById(id);
    }

    @Transactional
    public TicketDetailResponse requestReconsideration(Long id, RequestTicketReconsiderationRequest request) {
        // Load current user and ticket
        UserRole membership = ticketAccessService.getRequiredCurrentMembership();
        Ticket ticket = getManagedTicket(id);

        // Only rejected tickets can be reconsidered
        if (ticket.getStatus() != TicketStatus.REJECTED) {
            throw new IllegalArgumentException("Only rejected tickets can be submitted for reconsideration");
        }

        // Only student reporters can request reconsideration
        if (membership.getRole().getCode() != RoleCode.STUDENT) {
            throw new AccessDeniedException(
                    "Only students can ask admin to reconsider a rejected ticket");
        }

        // Only the original student reporter can request reconsideration
        if (!ticket.getReporterUser().getId().equals(membership.getUser().getId())) {
            throw new AccessDeniedException(
                    "Only the student who reported the ticket can ask admin to reconsider it");
        }

        // Only one reconsideration request is allowed
        if (defaultCount(ticket.getReconsiderationRequestCount()) >= 1) {
            throw new IllegalArgumentException(
                    "Only one reconsideration request is allowed for a rejected ticket");
        }

        // Record reconsideration request details
        ticket.setReconsiderationNote(request.note().trim());
        ticket.setReconsiderationRequestedAt(LocalDateTime.now());
        ticket.setReconsiderationReviewedAt(null);
        ticket.setReconsiderationRequestCount(defaultCount(ticket.getReconsiderationRequestCount()) + 1);
        ticketRepository.save(ticket);

        // Add a system comment for audit trail
        ticketCommentService.createSystemStatusNote(
                ticket, "Student requested reconsideration review", membership.getUser());
        notificationService.notifyTicketReconsiderationRequested(ticket);

        return getTicketById(id);
    }

    private void validateStatusTransition(Ticket ticket, TicketStatus nextStatus) {
        // Validate allowed transitions based on the ticket's current status
        TicketStatus currentStatus = ticket.getStatus();
        boolean validTransition =
                switch (currentStatus) {
                    case OPEN -> nextStatus == TicketStatus.IN_PROGRESS || nextStatus == TicketStatus.REJECTED;
                    case IN_PROGRESS -> nextStatus == TicketStatus.RESOLVED;
                    case RESOLVED -> nextStatus == TicketStatus.CLOSED;
                    case CLOSED -> false;
                    case REJECTED -> nextStatus == TicketStatus.REJECTED && hasPendingReconsiderationRequest(ticket);
                };
        if (!validTransition) {
            throw new IllegalArgumentException(
                    "Invalid ticket status transition from " + currentStatus + " to " + nextStatus);
        }
    }

    private boolean hasPendingReconsiderationRequest(Ticket ticket) {
        // A reconsideration is pending only when request exists and has not been reviewed yet
        return ticket.getStatus() == TicketStatus.REJECTED
                && ticket.getReconsiderationRequestedAt() != null
                && ticket.getReconsiderationReviewedAt() == null;
    }

    private Ticket getManagedTicket(Long id) {
        // Load basic ticket entity or fail if missing
        return ticketRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found for id: " + id));
    }

    private Ticket getDetailedTicket(Long id) {
        // Load ticket with detailed associations or fail if missing
        return ticketRepository
                .findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found for id: " + id));
    }

    private String generateTicketNumber() {
        // Generate a unique human-readable ticket number
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
        // Trim optional text and convert blank strings to null
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeSearch(String search) {
        // Normalize search input for repository filtering
        if (search == null || search.isBlank()) {
            return null;
        }
        return search.trim().toLowerCase(Locale.ROOT);
    }

    private String resolveDisplayName(User user) {
        // Prefer display name, otherwise fall back to email
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName();
        }
        return user.getEmail();
    }

    private void incrementStaffReviewCount(Ticket ticket) {
        // Increase staff review counter safely
        ticket.setStaffReviewCount(defaultCount(ticket.getStaffReviewCount()) + 1);
    }

    private void incrementAdminReviewCount(Ticket ticket) {
        // Increase admin review counter safely
        ticket.setAdminReviewCount(defaultCount(ticket.getAdminReviewCount()) + 1);
    }

    private int defaultCount(Integer value) {
        // Treat null counters as zero
        return value == null ? 0 : value;
    }
}
