package com.smartcampus.backend.modules.ticket.dto;

// Imports the @Size validation annotation
// This is used to limit the maximum length of string fields
import jakarta.validation.constraints.Size;

// This is a request DTO used when partially updating an existing ticket category
public record UpdateTicketCategoryRequest(

        // Optional updated category code
        //
        // @Size(max = 50) ensures that if a code is provided,
        // it must not exceed 50 characters
        //
        // This field is optional because PATCH is used for partial update,
        // so the client may choose to update only some fields
        @Size(max = 50, message = "Code must be at most 50 characters") String code,

        // Optional updated category name
        //
        // @Size(max = 100) ensures that if a name is provided,
        // it must not exceed 100 characters
        //
        // This field is also optional because not every PATCH request
        // needs to update the category name
        @Size(max = 100, message = "Name must be at most 100 characters") String name,

        // Optional updated category description
        // No validation is added here in this DTO
        String description,

        // Optional updated active/inactive status of the category
        // true  = active
        // false = inactive
        Boolean isActive) {}