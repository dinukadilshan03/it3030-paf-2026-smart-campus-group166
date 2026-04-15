import type { AdminUserSummary } from "@/lib/users/types";
import type { RoleCode } from "@/types/auth";

import type {
  ApiErrorResponse,
  TicketCategorySummary,
  TicketDetail,
  TicketFilters,
  TicketLocationOption,
  TicketPriority,
  TicketResourceOption,
  TicketStatus,
} from "@/lib/tickets/types";

export const TICKET_STATUSES: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
];

export const TICKET_PRIORITIES: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const DEFAULT_TICKET_FILTERS: Required<TicketFilters> = {
  status: "",
  priority: "",
  ticketCategoryId: "",
  search: "",
};

const MATCH_ALL_SEARCH_TOKEN = "%";

export class TicketApiError extends Error {
  status: number;
  code?: string;
  validationErrors: Record<string, string>;

  constructor(
    message: string,
    status: number,
    validationErrors: Record<string, string> = {},
    code?: string,
  ) {
    super(message);
    this.name = "TicketApiError";
    this.status = status;
    this.code = code;
    this.validationErrors = validationErrors;
  }
}

export function buildTicketQuery(filters: TicketFilters = {}) {
  const params = new URLSearchParams();

  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.ticketCategoryId) params.set("ticketCategoryId", String(filters.ticketCategoryId));
  const normalizedSearch = filters.search?.trim();
  params.set("search", normalizedSearch ? normalizedSearch : MATCH_ALL_SEARCH_TOKEN);

  const query = params.toString();
  return query ? `?${query}` : "";
}

async function parseJsonOrNull<T>(response: Response) {
  return (await response.json().catch(() => null)) as T | null;
}

export async function throwTicketApiError(response: Response): Promise<never> {
  const payload = await parseJsonOrNull<ApiErrorResponse>(response);
  const validationMessage =
    payload?.validationErrors && Object.keys(payload.validationErrors).length > 0
      ? Object.values(payload.validationErrors)[0]
      : null;

  throw new TicketApiError(
    validationMessage ||
      payload?.message ||
      payload?.code ||
      `Request failed with status ${response.status}`,
    response.status,
    payload?.validationErrors ?? {},
    payload?.code,
  );
}

export function getTicketErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallbackMessage;
}

export function toTicketTitleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";

  try {
    return new Intl.DateTimeFormat("en-LK", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatFileSize(bytes: number | null | undefined) {
  if (bytes == null || Number.isNaN(bytes)) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getAllowedStatusTargets(role: RoleCode, currentStatus: TicketStatus) {
  if (role === "ADMIN") {
    switch (currentStatus) {
      case "OPEN":
        return ["IN_PROGRESS", "REJECTED"] as TicketStatus[];
      case "IN_PROGRESS":
        return ["RESOLVED"] as TicketStatus[];
      case "RESOLVED":
        return ["CLOSED"] as TicketStatus[];
      default:
        return [] as TicketStatus[];
    }
  }

  if (role === "STAFF") {
    switch (currentStatus) {
      case "OPEN":
        return ["IN_PROGRESS"] as TicketStatus[];
      case "IN_PROGRESS":
        return ["RESOLVED"] as TicketStatus[];
      default:
        return [] as TicketStatus[];
    }
  }

  return [] as TicketStatus[];
}

export function canCurrentUserManageAttachments(
  role: RoleCode,
  currentUserId: number,
  ticket: TicketDetail,
) {
  return role === "ADMIN" || ticket.reporterUserId === currentUserId;
}

export function canCurrentUserAddInternalNote(
  role: RoleCode,
  currentUserId: number,
  ticket: TicketDetail,
) {
  return role === "ADMIN" || (role === "STAFF" && ticket.assignedStaffUserId === currentUserId);
}

export function canCurrentUserUpdateStatus(
  role: RoleCode,
  currentUserId: number,
  ticket: TicketDetail,
) {
  if (role === "ADMIN") {
    return getAllowedStatusTargets(role, ticket.status).length > 0;
  }

  if (role !== "STAFF") {
    return false;
  }

  return (
    ticket.assignedStaffUserId === currentUserId &&
    getAllowedStatusTargets(role, ticket.status).length > 0
  );
}

export function describeTicketScope(role: RoleCode) {
  switch (role) {
    case "ADMIN":
      return "All campus maintenance and incident tickets";
    case "STAFF":
      return "Tickets currently assigned to you";
    case "STUDENT":
      return "Your reported maintenance and incident tickets";
  }
}

export function getLocationLabel(location: TicketLocationOption) {
  const parts = [location.name, location.building, location.floor, location.roomIdentifier].filter(
    Boolean,
  );
  return parts.join(" · ");
}

export function getResourceLabel(resource: TicketResourceOption) {
  const parts = [resource.name, resource.resourceCode, resource.locationName].filter(Boolean);
  return parts.join(" · ");
}

export function findLocationForResource(
  resources: TicketResourceOption[],
  resourceId: number | null | undefined,
) {
  if (resourceId == null) return null;
  return resources.find((resource) => resource.id === resourceId)?.locationId ?? null;
}

export function toIdNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function resolveSelectedTicketId(
  tickets: { id: number }[],
  preferredId: number | null,
) {
  if (preferredId != null && tickets.some((ticket) => ticket.id === preferredId)) {
    return preferredId;
  }

  return tickets[0]?.id ?? null;
}

export function getOpenTicketCount(tickets: { status: TicketStatus }[]) {
  return tickets.filter((ticket) => ticket.status === "OPEN").length;
}

export function getInProgressTicketCount(tickets: { status: TicketStatus }[]) {
  return tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length;
}

export function getResolvedTicketCount(tickets: { status: TicketStatus }[]) {
  return tickets.filter((ticket) => ticket.status === "RESOLVED").length;
}

export function getUnassignedTicketCount(
  tickets: { status: TicketStatus; assignedStaffUserId: number | null }[],
) {
  return tickets.filter(
    (ticket) => !ticket.assignedStaffUserId && !["CLOSED", "REJECTED"].includes(ticket.status),
  ).length;
}

export function getActiveTicketCategories(categories: TicketCategorySummary[]) {
  return categories.filter((category) => category.isActive);
}

export function getActiveStaffOptions(users: AdminUserSummary[]) {
  return users.filter((user) => user.status === "ACTIVE");
}
