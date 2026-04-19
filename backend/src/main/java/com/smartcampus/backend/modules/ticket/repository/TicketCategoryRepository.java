package com.smartcampus.backend.modules.ticket.repository;

// Imports the TicketCategory entity that this repository manages
import com.smartcampus.backend.modules.ticket.entity.TicketCategory;

import java.util.Optional;

// JpaRepository provides built-in CRUD operations such as save, findById, findAll, deleteById
import org.springframework.data.jpa.repository.JpaRepository;

// Repository interface for TicketCategory entity
// Extends JpaRepository<TicketCategory, Long> where:
// - entity type = TicketCategory
// - primary key type = Long
public interface TicketCategoryRepository extends JpaRepository<TicketCategory, Long> {

    // Derived query method generated automatically by Spring Data JPA
    //
    // Purpose:
    // - find a ticket category by its code
    //
    // IgnoreCase means:
    // - the search will not be case-sensitive
    // - for example, "hardware", "HARDWARE", and "Hardware" are treated the same
    //
    // Optional<TicketCategory> is used because:
    // - the category may exist
    // - or it may not exist
    //
    // This method is useful for:
    // - validating whether a category code already exists before create/update
    // - retrieving a category using a business-friendly code
    Optional<TicketCategory> findByCodeIgnoreCase(String code);
}