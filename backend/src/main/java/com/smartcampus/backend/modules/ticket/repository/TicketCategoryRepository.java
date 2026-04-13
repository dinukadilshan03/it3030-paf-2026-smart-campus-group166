package com.smartcampus.backend.modules.ticket.repository;

import com.smartcampus.backend.modules.ticket.entity.TicketCategory;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketCategoryRepository extends JpaRepository<TicketCategory, Long> {

    Optional<TicketCategory> findByCodeIgnoreCase(String code);
}
