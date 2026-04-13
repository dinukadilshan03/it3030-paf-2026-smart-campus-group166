package com.smartcampus.backend.modules.ticket.controller;

import com.smartcampus.backend.modules.ticket.dto.TicketCreateDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketDetailsResponseDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketResponseDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketUpdateDTO;
import com.smartcampus.backend.modules.ticket.dto.TicketWorkflowUpdateDTO;
import com.smartcampus.backend.modules.ticket.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponseDTO addTicket(@Valid @RequestBody TicketCreateDTO ticketDTO) {
        return ticketService.addTicket(ticketDTO);
    }

    @PutMapping("/{id}")
    public TicketResponseDTO updateTicket(@PathVariable Long id, @Valid @RequestBody TicketUpdateDTO updateDTO) {
        return ticketService.updateTicket(id, updateDTO);
    }

    @PatchMapping("/{id}/workflow")
    public TicketResponseDTO updateTicketWorkflow(
            @PathVariable Long id,
            @Valid @RequestBody TicketWorkflowUpdateDTO workflowUpdateDTO
    ) {
        return ticketService.updateTicketWorkflow(id, workflowUpdateDTO);
    }

    @GetMapping
    public List<TicketResponseDTO> getAllTickets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search
    ) {
        return ticketService.getAllTickets(status, priority, category, search);
    }

    @GetMapping("/{id}")
    public TicketDetailsResponseDTO getTicket(@PathVariable Long id) {
        return ticketService.getTicketDetails(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTicket(@PathVariable Long id) {
        ticketService.deleteTicket(id);
    }
}
