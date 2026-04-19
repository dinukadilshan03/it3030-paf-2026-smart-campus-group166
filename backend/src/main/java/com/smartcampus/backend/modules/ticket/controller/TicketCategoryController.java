package com.smartcampus.backend.modules.ticket.controller;

// Request DTO used when creating a new ticket category
import com.smartcampus.backend.modules.ticket.dto.CreateTicketCategoryRequest;

// Response DTO used when returning full details of one ticket category
import com.smartcampus.backend.modules.ticket.dto.TicketCategoryDetailResponse;

// Response DTO used when returning a lighter summary list of ticket categories
import com.smartcampus.backend.modules.ticket.dto.TicketCategorySummaryResponse;

// Request DTO used when partially updating an existing ticket category
import com.smartcampus.backend.modules.ticket.dto.UpdateTicketCategoryRequest;

// Service layer that contains the business logic for ticket categories
import com.smartcampus.backend.modules.ticket.service.TicketCategoryService;

// Used to trigger validation rules defined inside request DTOs
import jakarta.validation.Valid;

import java.util.List;

// Lombok annotation that automatically generates constructor injection
import lombok.RequiredArgsConstructor;

// Used for returning specific HTTP status codes like 201 Created and 204 No Content
import org.springframework.http.HttpStatus;

// Used for role-based authorization on endpoints
import org.springframework.security.access.prepost.PreAuthorize;

// Spring MVC annotations for REST endpoint mappings
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController // Marks this class as a REST controller and automatically returns JSON responses
@RequestMapping("/api/v1/ticket-categories") // Base URL for all ticket category APIs
@RequiredArgsConstructor // Generates a constructor for all final fields for dependency injection
public class TicketCategoryController {

    // Service dependency that handles all ticket category business logic
    private final TicketCategoryService ticketCategoryService;

    // GET API: /api/v1/ticket-categories
    // Purpose: Retrieve all available ticket categories as a summary list
    @GetMapping
    public List<TicketCategorySummaryResponse> getTicketCategories() {
        // Calls service layer to fetch all categories
        return ticketCategoryService.getAll();
    }

    // GET API: /api/v1/ticket-categories/{id}
    // Purpose: Retrieve one specific ticket category by its unique ID
    @GetMapping("/{id}")
    public TicketCategoryDetailResponse getTicketCategoryById(@PathVariable Long id) {
        // id is used because it uniquely identifies the exact category to retrieve
        return ticketCategoryService.getById(id);
    }

    // POST API: /api/v1/ticket-categories
    // Purpose: Create a new ticket category
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')") // Only ADMIN users are allowed to create categories
    @ResponseStatus(HttpStatus.CREATED) // Returns HTTP 201 when a category is successfully created
    public TicketCategoryDetailResponse createTicketCategory(
            @Valid @RequestBody CreateTicketCategoryRequest request) {
        // @RequestBody converts incoming JSON into CreateTicketCategoryRequest
        // @Valid triggers validation annotations defined inside the DTO
        return ticketCategoryService.create(request);
    }

    // PATCH API: /api/v1/ticket-categories/{id}
    // Purpose: Partially update an existing ticket category
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Only ADMIN users are allowed to update categories
    public TicketCategoryDetailResponse updateTicketCategory(
            @PathVariable Long id, @Valid @RequestBody UpdateTicketCategoryRequest request) {
        // Update is done using the category ID because ID uniquely identifies
        // which existing category record should be modified
        //
        // PATCH was chosen instead of PUT because this endpoint is intended for
        // partial updates, meaning only selected fields of the category can be changed
        // without sending the entire full category object again
        //
        // PUT is usually used when replacing the whole resource
        // PATCH is better when updating only specific fields
        return ticketCategoryService.update(id, request);
    }

    // DELETE API: /api/v1/ticket-categories/{id}
    // Purpose: Delete a specific ticket category
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Only ADMIN users are allowed to delete categories
    @ResponseStatus(HttpStatus.NO_CONTENT) // Returns HTTP 204 when deletion succeeds
    public void deleteTicketCategory(@PathVariable Long id) {
        // Delete is done using ID because ID uniquely identifies
        // the exact category that should be removed
        ticketCategoryService.delete(id);
    }
}