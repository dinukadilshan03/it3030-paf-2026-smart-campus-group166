package com.smartcampus.backend.modules.ticket.service;

import com.smartcampus.backend.common.exception.DuplicateResourceException;
import com.smartcampus.backend.common.exception.ResourceConflictException;
import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.modules.ticket.dto.CreateTicketCategoryRequest;
import com.smartcampus.backend.modules.ticket.dto.TicketCategoryDetailResponse;
import com.smartcampus.backend.modules.ticket.dto.TicketCategorySummaryResponse;
import com.smartcampus.backend.modules.ticket.dto.UpdateTicketCategoryRequest;
import com.smartcampus.backend.modules.ticket.entity.TicketCategory;
import com.smartcampus.backend.modules.ticket.mapper.TicketMapper;
import com.smartcampus.backend.modules.ticket.repository.TicketCategoryRepository;
import com.smartcampus.backend.modules.ticket.repository.TicketRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TicketCategoryService {

    private final TicketCategoryRepository ticketCategoryRepository;
    private final TicketRepository ticketRepository;
    private final TicketMapper ticketMapper;

    @Transactional(readOnly = true)
    public List<TicketCategorySummaryResponse> getAll() {
        return ticketCategoryRepository.findAll().stream()
                .sorted(java.util.Comparator.comparing(TicketCategory::getName, String.CASE_INSENSITIVE_ORDER))
                .map(ticketMapper::toCategorySummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public TicketCategoryDetailResponse getById(Long id) {
        return ticketMapper.toCategoryDetail(getManagedCategory(id));
    }

    @Transactional
    public TicketCategoryDetailResponse create(CreateTicketCategoryRequest request) {
        validateUniqueCode(request.code(), null);
        TicketCategory category =
                TicketCategory.builder()
                        .code(normalizeCode(request.code()))
                        .name(request.name().trim())
                        .description(normalizeOptionalText(request.description()))
                        .isActive(request.isActive() == null ? true : request.isActive())
                        .build();

        return ticketMapper.toCategoryDetail(ticketCategoryRepository.save(category));
    }

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

    @Transactional
    public void delete(Long id) {
        TicketCategory category = getManagedCategory(id);
        if (ticketRepository.existsByTicketCategory_Id(id)) {
            throw new ResourceConflictException(
                    "Cannot delete ticket category while tickets still reference it");
        }
        ticketCategoryRepository.delete(category);
    }

    @Transactional(readOnly = true)
    public TicketCategory getManagedCategory(Long id) {
        return ticketCategoryRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket category not found for id: " + id));
    }

    private void validateUniqueCode(String code, Long currentId) {
        ticketCategoryRepository
                .findByCodeIgnoreCase(code.trim())
                .filter(existing -> !existing.getId().equals(currentId))
                .ifPresent(
                        existing -> {
                            throw new DuplicateResourceException("Ticket category code already exists");
                        });
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase();
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void validateRequiredText(String value, String label) {
        if (value.isBlank()) {
            throw new IllegalArgumentException(label + " cannot be blank");
        }
    }
}
