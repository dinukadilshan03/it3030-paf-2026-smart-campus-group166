import { clientApiFetch } from "@/lib/api/client";
import { buildTicketQuery, throwTicketApiError } from "@/lib/tickets/shared";
import type {
  CreateTicketAttachmentRequest,
  CreateTicketCategoryRequest,
  CreateTicketCommentRequest,
  CreateTicketRequest,
  TicketAttachment,
  TicketBundle,
  TicketCategoryDetail,
  TicketCategorySummary,
  TicketComment,
  TicketDetail,
  TicketFilters,
  TicketSummary,
  UpdateTicketAssignmentRequest,
  UpdateTicketCategoryRequest,
  UpdateTicketStatusRequest,
} from "@/lib/tickets/types";

async function sendJson<TResponse>(path: string, method: string, body?: object) {
  const response = await clientApiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) await throwTicketApiError(response);

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

export async function listTicketsClient(filters: TicketFilters = {}) {
  const response = await clientApiFetch(`/api/v1/tickets${buildTicketQuery(filters)}`, {
    cache: "no-store",
  });
  if (!response.ok) await throwTicketApiError(response);
  return ((await response.json()) as TicketSummary[]) ?? [];
}

export function getTicketDetailClient(id: number) {
  return sendJson<TicketDetail>(`/api/v1/tickets/${id}`, "GET");
}

export async function getTicketBundleClient(id: number): Promise<TicketBundle> {
  const [detail, comments, attachments] = await Promise.all([
    getTicketDetailClient(id),
    listTicketCommentsClient(id),
    listTicketAttachmentsClient(id),
  ]);

  return { detail, comments, attachments };
}

export function createTicketClient(payload: CreateTicketRequest) {
  return sendJson<TicketDetail>("/api/v1/tickets", "POST", payload);
}

export function updateTicketAssignmentClient(
  id: number,
  payload: UpdateTicketAssignmentRequest,
) {
  return sendJson<TicketDetail>(`/api/v1/tickets/${id}/assignment`, "PATCH", payload);
}

export function updateTicketStatusClient(id: number, payload: UpdateTicketStatusRequest) {
  return sendJson<TicketDetail>(`/api/v1/tickets/${id}/status`, "PATCH", payload);
}

export async function listTicketCommentsClient(ticketId: number) {
  const response = await clientApiFetch(`/api/v1/tickets/${ticketId}/comments`, {
    cache: "no-store",
  });
  if (!response.ok) await throwTicketApiError(response);
  return ((await response.json()) as TicketComment[]) ?? [];
}

export function createTicketCommentClient(
  ticketId: number,
  payload: CreateTicketCommentRequest,
) {
  return sendJson<TicketComment>(`/api/v1/tickets/${ticketId}/comments`, "POST", payload);
}

export async function listTicketAttachmentsClient(ticketId: number) {
  const response = await clientApiFetch(`/api/v1/tickets/${ticketId}/attachments`, {
    cache: "no-store",
  });
  if (!response.ok) await throwTicketApiError(response);
  return ((await response.json()) as TicketAttachment[]) ?? [];
}

export function createTicketAttachmentClient(
  ticketId: number,
  payload: CreateTicketAttachmentRequest,
) {
  return sendJson<TicketAttachment>(`/api/v1/tickets/${ticketId}/attachments`, "POST", payload);
}

export function deleteTicketAttachmentClient(ticketId: number, attachmentId: number) {
  return sendJson<void>(`/api/v1/tickets/${ticketId}/attachments/${attachmentId}`, "DELETE");
}

export async function listTicketCategoriesClient() {
  const response = await clientApiFetch("/api/v1/ticket-categories", {
    cache: "no-store",
  });
  if (!response.ok) await throwTicketApiError(response);
  return ((await response.json()) as TicketCategorySummary[]) ?? [];
}

export function createTicketCategoryClient(payload: CreateTicketCategoryRequest) {
  return sendJson<TicketCategoryDetail>("/api/v1/ticket-categories", "POST", payload);
}

export function updateTicketCategoryClient(
  id: number,
  payload: UpdateTicketCategoryRequest,
) {
  return sendJson<TicketCategoryDetail>(`/api/v1/ticket-categories/${id}`, "PATCH", payload);
}

export function deleteTicketCategoryClient(id: number) {
  return sendJson<void>(`/api/v1/ticket-categories/${id}`, "DELETE");
}
