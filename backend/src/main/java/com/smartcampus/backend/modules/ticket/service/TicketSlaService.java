package com.smartcampus.backend.modules.ticket.service;

import com.smartcampus.backend.common.exception.ResourceNotFoundException;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.repository.TicketRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TicketSlaService {

    private final TicketRepository ticketRepository;

    public boolean markFirstResponseIfNeeded(Ticket ticket) {
        if (ticket.getFirstRespondedAt() != null) {
            return false;
        }

        ticket.setFirstRespondedAt(LocalDateTime.now());
        return true;
    }

    @Transactional
    public boolean markFirstResponseIfNeeded(Long ticketId) {
        Ticket ticket =
                ticketRepository
                        .findById(ticketId)
                        .orElseThrow(() -> new ResourceNotFoundException("Ticket not found for id: " + ticketId));
        return markFirstResponseIfNeeded(ticket);
    }
}
