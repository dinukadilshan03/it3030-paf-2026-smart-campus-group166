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

    // Repository used to fetch ticket data from the database
    private final TicketRepository ticketRepository;

    public boolean markFirstResponseIfNeeded(Ticket ticket) {
        // If the ticket already has a first response timestamp, do nothing
        if (ticket.getFirstRespondedAt() != null) {
            return false;
        }

        // Set the first response time to now
        ticket.setFirstRespondedAt(LocalDateTime.now());
        return true;
    }

    @Transactional
    public boolean markFirstResponseIfNeeded(Long ticketId) {
        // Fetch the ticket by ID, or throw an exception if it does not exist
        Ticket ticket =
                ticketRepository
                        .findById(ticketId)
                        .orElseThrow(() -> new ResourceNotFoundException("Ticket not found for id: " + ticketId));

        // Reuse the overloaded method to update the SLA response timestamp
        return markFirstResponseIfNeeded(ticket);
    }
}