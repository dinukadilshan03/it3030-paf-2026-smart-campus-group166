import { serverApiFetch } from "@/lib/api/server";
import { buildTicketQuery, throwTicketApiError } from "@/lib/tickets/shared";
import type {
  TicketAttachment,
  TicketBundle,
  TicketCategorySummary,
  TicketComment,
  TicketDetail,
  TicketFilters,
  TicketLocationOption,
  TicketResourceOption,
  TicketSummary,
} from "@/lib/tickets/types";
import type { AdminUserSummary } from "@/lib/users/types";

export async function listTicketsServer(filters: TicketFilters = {}) {
  const response = await serverApiFetch(`/api/v1/tickets${buildTicketQuery(filters)}`);
  if (!response.ok) await throwTicketApiError(response);
  return ((await response.json()) as TicketSummary[]) ?? [];
}

export async function getTicketDetailServer(id: number) {
  const response = await serverApiFetch(`/api/v1/tickets/${id}`);
  if (!response.ok) await throwTicketApiError(response);
  return (await response.json()) as TicketDetail;
}

export async function listTicketCommentsServer(ticketId: number) {
  const response = await serverApiFetch(`/api/v1/tickets/${ticketId}/comments`);
  if (!response.ok) await throwTicketApiError(response);
  return ((await response.json()) as TicketComment[]) ?? [];
}

export async function listTicketAttachmentsServer(ticketId: number) {
  const response = await serverApiFetch(`/api/v1/tickets/${ticketId}/attachments`);
  if (!response.ok) await throwTicketApiError(response);
  return ((await response.json()) as TicketAttachment[]) ?? [];
}

export async function getTicketBundleServer(ticketId: number): Promise<TicketBundle> {
  const [detail, comments, attachments] = await Promise.all([
    getTicketDetailServer(ticketId),
    listTicketCommentsServer(ticketId),
    listTicketAttachmentsServer(ticketId),
  ]);

  return { detail, comments, attachments };
}

export async function listTicketCategoriesServer() {
  const response = await serverApiFetch("/api/v1/ticket-categories");
  if (!response.ok) await throwTicketApiError(response);
  return ((await response.json()) as TicketCategorySummary[]) ?? [];
}

export async function listTicketResourcesServer() {
  const response = await serverApiFetch("/api/v1/resources?search=%25");
  if (!response.ok) await throwTicketApiError(response);
  return ((await response.json()) as TicketResourceOption[]) ?? [];
}

export async function listTicketLocationsServer() {
  const response = await serverApiFetch("/api/v1/locations");
  if (!response.ok) await throwTicketApiError(response);
  return ((await response.json()) as TicketLocationOption[]) ?? [];
}

export async function listAssignableStaffServer() {
  const response = await serverApiFetch("/api/v1/users?role=STAFF&status=ACTIVE");
  if (!response.ok) await throwTicketApiError(response);
  return ((await response.json()) as AdminUserSummary[]) ?? [];
}
