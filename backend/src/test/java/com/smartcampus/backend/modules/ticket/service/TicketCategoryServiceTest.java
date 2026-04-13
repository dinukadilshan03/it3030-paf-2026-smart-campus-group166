package com.smartcampus.backend.modules.ticket.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.common.exception.DuplicateResourceException;
import com.smartcampus.backend.common.exception.ResourceConflictException;
import com.smartcampus.backend.modules.ticket.dto.CreateTicketCategoryRequest;
import com.smartcampus.backend.modules.ticket.entity.TicketCategory;
import com.smartcampus.backend.modules.ticket.mapper.TicketMapper;
import com.smartcampus.backend.modules.ticket.repository.TicketCategoryRepository;
import com.smartcampus.backend.modules.ticket.repository.TicketRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TicketCategoryServiceTest {

    @Mock private TicketCategoryRepository ticketCategoryRepository;
    @Mock private TicketRepository ticketRepository;

    private TicketCategoryService ticketCategoryService;

    @BeforeEach
    void setUp() {
        ticketCategoryService =
                new TicketCategoryService(ticketCategoryRepository, ticketRepository, new TicketMapper());
    }

    @Test
    void rejectsDuplicateCategoryCode() {
        when(ticketCategoryRepository.findByCodeIgnoreCase("MAINT"))
                .thenReturn(Optional.of(TicketCategory.builder().id(1L).code("MAINT").build()));

        assertThatThrownBy(
                        () ->
                                ticketCategoryService.create(
                                        new CreateTicketCategoryRequest(
                                                "MAINT", "Maintenance", "desc", true)))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("code already exists");
    }

    @Test
    void deleteFailsWhenTicketsStillReferenceCategory() {
        TicketCategory category = TicketCategory.builder().id(2L).code("SAFETY").name("Safety").build();
        when(ticketCategoryRepository.findById(2L)).thenReturn(Optional.of(category));
        when(ticketRepository.existsByTicketCategory_Id(2L)).thenReturn(true);

        assertThatThrownBy(() -> ticketCategoryService.delete(2L))
                .isInstanceOf(ResourceConflictException.class)
                .hasMessageContaining("tickets still reference it");
    }
}
