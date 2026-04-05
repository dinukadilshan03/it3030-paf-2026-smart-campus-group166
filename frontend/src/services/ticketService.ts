import type {
  TicketAssignment,
  TicketComment,
  TicketDetails,
  TicketFilters,
  TicketSummary,
  TicketWorkflowUpdate,
} from '../types/ticket';
import { apiFetch, apiRequest } from './api';

function buildQuery(params: TicketFilters) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value && value.trim()) {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export function getTickets(filters: TicketFilters) {
  return apiFetch<TicketSummary[]>(`/api/tickets${buildQuery(filters)}`);
}

export function getTicketDetails(ticketId: number) {
  return apiFetch<TicketDetails>(`/api/tickets/${ticketId}`);
}

export function updateTicketWorkflow(ticketId: number, payload: TicketWorkflowUpdate) {
  return apiFetch<TicketSummary>(`/api/tickets/${ticketId}/workflow`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function assignTechnician(ticketId: number, technicianId: number) {
  return apiFetch<TicketAssignment>(`/api/tickets/${ticketId}/assignments`, {
    method: 'POST',
    body: JSON.stringify({ technicianId }),
  });
}

export function createTicketComment(ticketId: number, content: string) {
  return apiFetch<TicketComment>(`/api/tickets/${ticketId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export function updateTicketComment(ticketId: number, commentId: number, content: string) {
  return apiFetch<TicketComment>(`/api/tickets/${ticketId}/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

export function deleteTicketComment(ticketId: number, commentId: number) {
  return apiRequest(`/api/tickets/${ticketId}/comments/${commentId}`, {
    method: 'DELETE',
  });
}
