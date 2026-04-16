package com.smartcampus.backend.modules.ticket.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateTicketCommentRequest(@NotBlank(message = "Comment body is required") String body) {}
