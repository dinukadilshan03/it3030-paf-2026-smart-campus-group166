package com.smartcampus.backend.modules.ticket.dto;

// This is a response DTO used to send a lighter/shorter version
// of ticket category data from backend to frontend
//
// It is called "SummaryResponse" because it contains only the main fields
// needed for list views or dropdowns, not the full detailed metadata
public record TicketCategorySummaryResponse(

        // Unique ID of the ticket category
        Long id,

        // Short unique code for the category
        // Example: HARDWARE, NETWORK, SOFTWARE
        String code,

        // Human-readable category name
        String name,

        // Short description of the category
        String description,

        // Indicates whether the category is active and available for use
        // true  = active
        // false = inactive
        Boolean isActive) {}