package com.smartcampus.backend.modules.ticket.service;

import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.modules.auth.service.CurrentUserService;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TicketAccessService {

    private final CurrentUserService currentUserService;

    public UserRole getRequiredCurrentMembership() {
        return currentUserService
                .getCurrentUserRole()
                .orElseThrow(() -> new AccessDeniedException("Authenticated user context is required"));
    }

    public void ensureCanViewTicket(UserRole membership, Ticket ticket) {
        RoleCode roleCode = membership.getRole().getCode();
        if (roleCode == RoleCode.ADMIN) {
            return;
        }
        if (roleCode == RoleCode.STUDENT
                && ticket.getReporterUser().getId().equals(membership.getUser().getId())) {
            return;
        }
        if (roleCode == RoleCode.STAFF
                && ticket.getAssignedStaffUser() != null
                && ticket.getAssignedStaffUser().getId().equals(membership.getUser().getId())) {
            return;
        }
        throw new AccessDeniedException("You do not have permission to access this ticket");
    }

    public void ensureCanAddPublicComment(UserRole membership, Ticket ticket) {
        if (membership.getRole().getCode() == RoleCode.ADMIN) {
            return;
        }
        if (ticket.getReporterUser().getId().equals(membership.getUser().getId())) {
            return;
        }
        if (membership.getRole().getCode() == RoleCode.STAFF
                && ticket.getAssignedStaffUser() != null
                && ticket.getAssignedStaffUser().getId().equals(membership.getUser().getId())) {
            return;
        }
        throw new AccessDeniedException("You do not have permission to comment on this ticket");
    }

    public void ensureCanAddInternalNote(UserRole membership, Ticket ticket) {
        if (membership.getRole().getCode() == RoleCode.ADMIN) {
            return;
        }
        if (membership.getRole().getCode() == RoleCode.STAFF
                && ticket.getAssignedStaffUser() != null
                && ticket.getAssignedStaffUser().getId().equals(membership.getUser().getId())) {
            return;
        }
        throw new AccessDeniedException("Only assigned staff or admins can add internal notes");
    }

    public void ensureCanManageAttachments(UserRole membership, Ticket ticket) {
        if (membership.getRole().getCode() == RoleCode.ADMIN) {
            return;
        }
        if (ticket.getReporterUser().getId().equals(membership.getUser().getId())) {
            return;
        }
        throw new AccessDeniedException("You do not have permission to manage ticket attachments");
    }
}
