package com.smartcampus.backend.modules.ticket.service;

// UserRole represents the authenticated user's membership/role context
import com.smartcampus.backend.common.entity.UserRole;

// Enum used to check role codes such as ADMIN, STAFF, STUDENT
import com.smartcampus.backend.common.enums.RoleCode;

// Service used to get the currently authenticated user and role context
import com.smartcampus.backend.modules.auth.service.CurrentUserService;

// Ticket entity used for permission checks against reporter/assignee
import com.smartcampus.backend.modules.ticket.entity.Ticket;

// Lombok annotation to generate constructor injection for final fields
import lombok.RequiredArgsConstructor;

// Spring Security exception thrown when access is not allowed
import org.springframework.security.access.AccessDeniedException;

// Marks this class as a Spring service bean
import org.springframework.stereotype.Service;

@Service // Registers this class as a service component
@RequiredArgsConstructor // Generates constructor for final fields
public class TicketAccessService {

    // Service used to read the currently authenticated user's role/membership
    private final CurrentUserService currentUserService;

    // Gets the current authenticated membership/role context
    //
    // Why this method exists:
    // - many access checks need the current user's role and identity
    // - instead of repeating that logic, this method centralizes it
    //
    // If no authenticated user role is found, access is denied
    public UserRole getRequiredCurrentMembership() {
        return currentUserService
                .getCurrentUserRole()
                .orElseThrow(() -> new AccessDeniedException("Authenticated user context is required"));
    }

    // Checks whether the current user is allowed to VIEW a given ticket
    //
    // Access rules:
    // - ADMIN can view any ticket
    // - STUDENT can view only tickets they reported
    // - STAFF can view:
    //      1. tickets assigned to them
    //      2. or tickets they themselves reported
    //
    // If none of these conditions match, access is denied
    public void ensureCanViewTicket(UserRole membership, Ticket ticket) {
        RoleCode roleCode = membership.getRole().getCode();

        // ADMIN has full access to all tickets
        if (roleCode == RoleCode.ADMIN) {
            return;
        }

        // STUDENT can view only their own reported tickets
        if (roleCode == RoleCode.STUDENT
                && ticket.getReporterUser().getId().equals(membership.getUser().getId())) {
            return;
        }

        // STAFF can view tickets assigned to them
        // or tickets they themselves reported
        if (roleCode == RoleCode.STAFF
                && ((ticket.getAssignedStaffUser() != null
                                && ticket.getAssignedStaffUser()
                                        .getId()
                                        .equals(membership.getUser().getId()))
                        || ticket.getReporterUser().getId().equals(membership.getUser().getId()))) {
            return;
        }

        // If none of the allowed cases matched, deny access
        throw new AccessDeniedException("You do not have permission to access this ticket");
    }

    // Checks whether the current user can add a PUBLIC comment to the ticket
    //
    // Access rules:
    // - ADMIN can always comment
    // - Reporter of the ticket can comment
    // - Assigned STAFF member can comment
    //
    // This is for public comments visible in the main ticket discussion
    public void ensureCanAddPublicComment(UserRole membership, Ticket ticket) {

        // ADMIN can always add public comments
        if (membership.getRole().getCode() == RoleCode.ADMIN) {
            return;
        }

        // Ticket reporter can add public comments
        if (ticket.getReporterUser().getId().equals(membership.getUser().getId())) {
            return;
        }

        // Assigned staff can add public comments
        if (membership.getRole().getCode() == RoleCode.STAFF
                && ticket.getAssignedStaffUser() != null
                && ticket.getAssignedStaffUser().getId().equals(membership.getUser().getId())) {
            return;
        }

        // Otherwise deny access
        throw new AccessDeniedException("You do not have permission to comment on this ticket");
    }

    // Checks whether the current user can add an INTERNAL NOTE
    //
    // Access rules:
    // - ADMIN can always add internal notes
    // - Only the STAFF member assigned to the ticket can add internal notes
    //
    // This is stricter than public comments because internal notes are usually
    // meant for staff/admin-side workflow communication
    public void ensureCanAddInternalNote(UserRole membership, Ticket ticket) {

        // ADMIN can always add internal notes
        if (membership.getRole().getCode() == RoleCode.ADMIN) {
            return;
        }

        // Assigned staff can add internal notes
        if (membership.getRole().getCode() == RoleCode.STAFF
                && ticket.getAssignedStaffUser() != null
                && ticket.getAssignedStaffUser().getId().equals(membership.getUser().getId())) {
            return;
        }

        // Otherwise deny access
        throw new AccessDeniedException("Only assigned staff or admins can add internal notes");
    }

    // Checks whether the current user can manage ticket attachments
    //
    // Access rules:
    // - only the STUDENT who reported the ticket can manage attachments
    //
    // Here "manage" may include adding or deleting attachments
    public void ensureCanManageAttachments(UserRole membership, Ticket ticket) {
        if (membership.getRole().getCode() == RoleCode.STUDENT
                && ticket.getReporterUser().getId().equals(membership.getUser().getId())) {
            return;
        }

        throw new AccessDeniedException(
                "Only the student who raised the ticket can manage ticket images.");
    }
}
