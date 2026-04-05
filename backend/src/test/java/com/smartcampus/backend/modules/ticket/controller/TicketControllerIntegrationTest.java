package com.smartcampus.backend.modules.ticket.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.backend.common.entity.Resource;
import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.enums.OAuthProvider;
import com.smartcampus.backend.common.enums.RoleType;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.common.repository.RoleRepository;
import com.smartcampus.backend.common.repository.UserRepository;
import com.smartcampus.backend.modules.resource.repository.ResourceRepository;
import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.enums.TicketPriority;
import com.smartcampus.backend.modules.ticket.enums.TicketStatus;
import com.smartcampus.backend.modules.ticket.repository.TicketRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TicketControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Test
    @WithMockUser(username = "admin@smartcampus.local", roles = "ADMIN")
    void adminCanManageTicketWorkflow() throws Exception {
        User reporter = createUser("reporter@smartcampus.local", "Campus Reporter", RoleType.USER);
        User technician = createUser("tech@smartcampus.local", "Campus Technician", RoleType.TECHNICIAN);
        Resource resource = createResource();
        Ticket ticket = createTicket(resource, reporter);

        mockMvc.perform(get("/api/tickets")
                        .param("status", "OPEN")
                        .param("priority", "HIGH")
                        .param("search", "projector"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(ticket.getId()))
                .andExpect(jsonPath("$[0].reportedByEmail").value("reporter@smartcampus.local"));

        mockMvc.perform(post("/api/tickets/{ticketId}/assignments", ticket.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AssignmentRequest(technician.getUserId()))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.technicianEmail").value("tech@smartcampus.local"));

        mockMvc.perform(patch("/api/tickets/{ticketId}/workflow", ticket.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new WorkflowRequest("RESOLVED", "Replaced the damaged HDMI cable", null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolutionNotes").value("Replaced the damaged HDMI cable"));

        mockMvc.perform(post("/api/tickets/{ticketId}/comments", ticket.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CommentRequest("Issue verified and resolved."))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userEmail").value("admin@smartcampus.local"));

        mockMvc.perform(get("/api/tickets/{ticketId}", ticket.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticket.currentAssignment.technicianName").value("Campus Technician"))
                .andExpect(jsonPath("$.assignments.length()").value(1))
                .andExpect(jsonPath("$.comments.length()").value(1))
                .andExpect(jsonPath("$.attachments.length()").value(0));
    }

    @Test
    @WithMockUser(username = "student@smartcampus.local", roles = "USER")
    void nonAdminCannotAccessTicketEndpoints() throws Exception {
        mockMvc.perform(get("/api/tickets"))
                .andExpect(status().isForbidden());
    }

    private Ticket createTicket(Resource resource, User reporter) {
        Ticket ticket = new Ticket();
        ticket.setResource(resource);
        ticket.setReportedBy(reporter);
        ticket.setCategory("Projector");
        ticket.setPriority(TicketPriority.HIGH);
        ticket.setDescription("Projector has no display output");
        ticket.setPreferredContact("0771234567");
        ticket.setStatus(TicketStatus.OPEN);
        return ticketRepository.save(ticket);
    }

    private Resource createResource() {
        Resource resource = new Resource();
        resource.setName("Engineering Lab 2 Projector");
        resource.setType("PROJECTOR");
        resource.setCapacity(1);
        resource.setLocation("Engineering Lab 2");
        resource.setStatus("ACTIVE");
        resource.setDescription("Ceiling mounted projector in Lab 2");
        return resourceRepository.save(resource);
    }

    private User createUser(String email, String name, RoleType roleType) {
        Role role = roleRepository.findByRoleName(roleType.name()).orElseThrow();
        return userRepository.save(User.builder()
                .name(name)
                .email(email)
                .role(role)
                .oauthProvider(OAuthProvider.LOCAL)
                .status(UserStatus.ACTIVE)
                .build());
    }

    private record AssignmentRequest(Long technicianId) {
    }

    private record WorkflowRequest(String status, String resolutionNotes, String rejectionReason) {
    }

    private record CommentRequest(String content) {
    }
}
