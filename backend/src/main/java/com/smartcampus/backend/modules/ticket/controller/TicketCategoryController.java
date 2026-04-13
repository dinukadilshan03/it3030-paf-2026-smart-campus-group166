package com.smartcampus.backend.modules.ticket.controller;

import com.smartcampus.backend.modules.ticket.dto.CreateTicketCategoryRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketCategoryDetailResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketCategorySummaryResponse;
import com.smartcampus.backend.modules.ticket.dto.UpdateTicketCategoryRequest;
import com.smartcampus.backend.modules.ticket.service.TicketCategoryService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ticket-categories")
@RequiredArgsConstructor
public class TicketCategoryController {

    private final TicketCategoryService ticketCategoryService;

    @GetMapping
    public List<TicketCategorySummaryResponse> getTicketCategories() {
        return ticketCategoryService.getAll();
    }

    @GetMapping("/{id}")
    public TicketCategoryDetailResponse getTicketCategoryById(@PathVariable Long id) {
        return ticketCategoryService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public TicketCategoryDetailResponse createTicketCategory(
            @Valid @RequestBody CreateTicketCategoryRequest request) {
        return ticketCategoryService.create(request);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TicketCategoryDetailResponse updateTicketCategory(
            @PathVariable Long id, @Valid @RequestBody UpdateTicketCategoryRequest request) {
        return ticketCategoryService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTicketCategory(@PathVariable Long id) {
        ticketCategoryService.delete(id);
    }
}
