package com.smartcampus.backend.modules.ticket.service;

// Custom exception thrown when a duplicate resource already exists
import com.smartcampus.backend.common.exception.DuplicateResourceException;

// Custom exception thrown when a delete/update action would violate an existing dependency
import com.smartcampus.backend.common.exception.ResourceConflictException;

// Custom exception thrown when a resource cannot be found
import com.smartcampus.backend.common.exception.ResourceNotFoundException;

// Request DTO used for category creation
import com.smartcampus.backend.modules.ticket.dto.CreateTicketCategoryRequest;

// Response DTO for full category details
import com.smartcampus.backend.modules.ticket.dto.TicketCategoryDetailResponse;

// Response DTO for summary category listing
import com.smartcampus.backend.modules.ticket.dto.TicketCategorySummaryResponse;

// Request DTO used for partial category update
import com.smartcampus.backend.modules.ticket.dto.UpdateTicketCategoryRequest;

// TicketCategory entity managed by this service
import com.smartcampus.backend.modules.ticket.entity.TicketCategory;

// Mapper used to convert entity objects into DTO responses
import com.smartcampus.backend.modules.ticket.mapper.TicketMapper;

// Repository for ticket category persistence
import com.smartcampus.backend.modules.ticket.repository.TicketCategoryRepository;

// Repository for ticket persistence, used here to check category usage before deletion
import com.smartcampus.backend.modules.ticket.repository.TicketRepository;

import java.util.List;

// Lombok annotation for constructor injection
import lombok.RequiredArgsConstructor;

// Marks this class as a Spring service bean
import org.springframework.stereotype.Service;

// Transaction management annotations
import org.springframework.transaction.annotation.Transactional;

@Service // Registers this class as a Spring service
@RequiredArgsConstructor // Generates constructor for final fields
public class TicketCategoryService {

    // Repository used for ticket category database operations
    private final TicketCategoryRepository ticketCategoryRepository;

    // Repository used to check whether tickets still reference a category
    private final TicketRepository ticketRepository;

    // Mapper used to convert TicketCategory entities into response DTOs
    private final TicketMapper ticketMapper;

    // Returns all ticket categories as summary responses
    //
    // Steps:
    // 1. fetch all categories
    // 2. sort them alphabetically by name (case-insensitive)
    // 3. map them into summary DTOs
    @Transactional(readOnly = true)
    public List<TicketCategorySummaryResponse> getAll() {
        return ticketCategoryRepository.findAll().stream()
                .sorted(java.util.Comparator.comparing(TicketCategory::getName, String.CASE_INSENSITIVE_ORDER))
                .map(ticketMapper::toCategorySummary)
                .toList();
    }

    // Returns one ticket category by ID as a detailed response DTO
    //
    // Which field is used and why:
    // - id is used because it uniquely identifies the exact category to retrieve
    @Transactional(readOnly = true)
    public TicketCategoryDetailResponse getById(Long id) {
        return ticketMapper.toCategoryDetail(getManagedCategory(id));
    }

    // Creates a new ticket category
    //
    // Steps:
    // 1. validate category code uniqueness
    // 2. build the category entity
    // 3. normalize code to uppercase
    // 4. trim name
    // 5. normalize optional description
    // 6. default isActive to true if not provided
    // 7. save category
    // 8. return detailed response DTO
    @Transactional
    public TicketCategoryDetailResponse create(CreateTicketCategoryRequest request) {
        validateUniqueCode(request.code(), null);

        TicketCategory category =
                TicketCategory.builder()
                        .code(normalizeCode(request.code())) // normalized uppercase category code
                        .name(request.name().trim()) // trimmed category name
                        .description(normalizeOptionalText(request.description())) // null if blank
                        .isActive(request.isActive() == null ? true : request.isActive()) // default active
                        .build();

        return ticketMapper.toCategoryDetail(ticketCategoryRepository.save(category));
    }

    // Updates an existing ticket category
    //
    // Which field is used for edit and why:
    // - id is used because it uniquely identifies which category should be updated
    //
    // Why PATCH-style update logic is used:
    // - request fields are optional
    // - only provided fields are changed
    // - this matches partial update behavior
    //
    // Update rules:
    // - if code is provided, validate it and ensure uniqueness
    // - if name is provided, validate and trim it
    // - if description is provided, normalize blank to null
    // - if isActive is provided, update it
    @Transactional
    public TicketCategoryDetailResponse update(Long id, UpdateTicketCategoryRequest request) {
        TicketCategory category = getManagedCategory(id);

        if (request.code() != null) {
            validateRequiredText(request.code(), "Ticket category code");
            validateUniqueCode(request.code(), id);
            category.setCode(normalizeCode(request.code()));
        }

        if (request.name() != null) {
            validateRequiredText(request.name(), "Ticket category name");
            category.setName(request.name().trim());
        }

        if (request.description() != null) {
            category.setDescription(normalizeOptionalText(request.description()));
        }

        if (request.isActive() != null) {
            category.setIsActive(request.isActive());
        }

        return ticketMapper.toCategoryDetail(ticketCategoryRepository.save(category));
    }

    // Deletes a ticket category
    //
    // Which field is used and why:
    // - id is used because it uniquely identifies the category to delete
    //
    // Important business rule:
    // - do not allow deletion if any ticket still references this category
    //
    // Why:
    // - prevents broken foreign-key relationships / orphan references
    @Transactional
    public void delete(Long id) {
        TicketCategory category = getManagedCategory(id);

        if (ticketRepository.existsByTicketCategory_Id(id)) {
            throw new ResourceConflictException(
                    "Cannot delete ticket category while tickets still reference it");
        }

        ticketCategoryRepository.delete(category);
    }

    // Loads a managed TicketCategory entity by ID
    //
    // Which field is used and why:
    // - id is used because it uniquely identifies the category
    //
    // Throws ResourceNotFoundException if category does not exist
    @Transactional(readOnly = true)
    public TicketCategory getManagedCategory(Long id) {
        return ticketCategoryRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket category not found for id: " + id));
    }

    // Validates that the category code is unique
    //
    // Parameters:
    // - code: the category code to validate
    // - currentId: current category ID during update, null during create
    //
    // Why currentId is needed:
    // - during update, the existing category itself should not be treated as a duplicate
    private void validateUniqueCode(String code, Long currentId) {
        ticketCategoryRepository
                .findByCodeIgnoreCase(code.trim())
                .filter(existing -> !existing.getId().equals(currentId))
                .ifPresent(
                        existing -> {
                            throw new DuplicateResourceException("Ticket category code already exists");
                        });
    }

    // Normalizes category code by trimming whitespace and converting to uppercase
    //
    // Why:
    // - keeps category codes consistent in the database
    // - avoids duplicates like "hardware" vs "HARDWARE"
    private String normalizeCode(String code) {
        return code.trim().toUpperCase();
    }

    // Normalizes optional text input
    //
    // Behavior:
    // - null stays null
    // - blank strings become null
    // - otherwise return trimmed value
    //
    // Useful for optional description fields
    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    // Validates that a required text field is not blank
    //
    // Used for update requests where fields are optional overall,
    // but if they are provided, they must not be blank
    private void validateRequiredText(String value, String label) {
        if (value.isBlank()) {
            throw new IllegalArgumentException(label + " cannot be blank");
        }
    }
}