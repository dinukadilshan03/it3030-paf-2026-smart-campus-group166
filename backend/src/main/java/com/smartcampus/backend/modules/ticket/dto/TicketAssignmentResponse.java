package com.smartcampus.backend.modules.ticket.dto;

// Imports LocalDateTime to store date and time values such as assignment time
import java.time.LocalDateTime;

// This is a response DTO used to send ticket assignment details
// from backend to frontend
public record TicketAssignmentResponse(

        // Unique ID of the assignment record
        Long id,

        // User ID of the person to whom the ticket is assigned
        Long assignedToUserId,

        // Display name of the assigned user
        String assignedToDisplayName,

        // User ID of the person who made the assignment
        Long assignedByUserId,

        // Display name of the user who made the assignment
        String assignedByDisplayName,

        // Optional note added during assignment
        String assignmentNote,

        // Indicates whether this assignment is currently active
        // true = currently assigned
        // false = no longer active / assignment ended
        Boolean isActive,

        // Date and time when the assignment was created
        LocalDateTime assignedAt,

        // Date and time when the assignment was removed or ended
        // This can be null if the assignment is still active
        LocalDateTime unassignedAt) {}