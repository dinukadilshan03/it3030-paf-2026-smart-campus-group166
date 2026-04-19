import { getApiBaseUrl } from "@/lib/config/env";
import type { AdminUserSummary } from "@/lib/users/types";
import type { RoleCode } from "@/types/auth";

import type {
  ApiErrorResponse,
  TicketAgeFilter,
  TicketCategorySummary,
  TicketComment,
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
  age: "",
  search: "",
};

export const OLD_TICKET_AGE_DAYS = 30;

type TicketSlaRecord = {
  createdAt: string;
  priority: TicketPriority;
  status: TicketStatus;
  firstRespondedAt?: string | null;
  resolvedAt?: string | null;
};

export type TicketSlaTimerState = {
  label: string;
  tone: "neutral" | "success" | "danger";
};

const MATCH_ALL_SEARCH_TOKEN = "%";

const TICKET_SLA_TARGETS: Record<
  TicketPriority,
  { firstResponseMinutes: number; resolutionMinutes: number }
> = {
  LOW: { firstResponseMinutes: 8 * 60, resolutionMinutes: 72 * 60 },
  MEDIUM: { firstResponseMinutes: 4 * 60, resolutionMinutes: 48 * 60 },
  HIGH: { firstResponseMinutes: 2 * 60, resolutionMinutes: 24 * 60 },
  URGENT: { firstResponseMinutes: 60, resolutionMinutes: 8 * 60 },
};

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

export function getTicketAttachmentContentUrl(ticketId: number, attachmentId: number) {
  return `${getApiBaseUrl()}/api/v1/tickets/${ticketId}/attachments/${attachmentId}/content`;
}

export function getTicketAttachmentFormatLabel(mimeType: string | null | undefined, fileName: string) {
  if (mimeType) {
    return mimeType.replace("image/", "").toUpperCase();
  }

  const extension = fileName.split(".").pop()?.trim();
  return extension ? extension.toUpperCase() : "Image";
}

export function getAllowedStatusTargets(
  role: RoleCode,
  ticket:
    | TicketStatus
    | Pick<
        TicketDetail,
        | "status"
        | "reconsiderationRequestedAt"
        | "reconsiderationReviewedAt"
        | "reconsiderationRequestCount"
      >,
) {
  const currentStatus = typeof ticket === "string" ? ticket : ticket.status;
  const hasPendingReconsiderationReview =
    typeof ticket !== "string" &&
    ticket.status === "REJECTED" &&
    Boolean(ticket.reconsiderationRequestedAt) &&
    !ticket.reconsiderationReviewedAt &&
    ticket.reconsiderationRequestCount > 0;

  if (role === "ADMIN") {
    switch (currentStatus) {
      case "OPEN":
        return ["REJECTED"] as TicketStatus[];
      case "RESOLVED":
        return ["CLOSED"] as TicketStatus[];
      case "REJECTED":
        return hasPendingReconsiderationReview ? (["REJECTED"] as TicketStatus[]) : [];
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
  return role === "STUDENT" && ticket.reporterUserId === currentUserId;
}

export function canCurrentUserEditTicket(
  role: RoleCode,
  currentUserId: number,
  ticket: TicketDetail,
) {
  return ticket.reporterUserId === currentUserId && ticket.status === "OPEN";
}

export function canCurrentUserDeleteTicket(
  role: RoleCode,
  currentUserId: number,
  ticket: TicketDetail,
) {
  if (ticket.status !== "OPEN") {
    return false;
  }

  return role !== "ADMIN" && ticket.reporterUserId === currentUserId;
}

export function canCurrentUserAddInternalNote(
  role: RoleCode,
  currentUserId: number,
  ticket: TicketDetail,
) {
  return role === "ADMIN" || (role === "STAFF" && ticket.assignedStaffUserId === currentUserId);
}

export function canCurrentUserManageComment(
  role: RoleCode,
  currentUserId: number,
  comment: TicketComment,
) {
  if (comment.commentType === "STATUS_NOTE") {
    return false;
  }

  return role === "ADMIN" || comment.authorUserId === currentUserId;
}

export function canCurrentUserUpdateStatus(
  role: RoleCode,
  currentUserId: number,
  ticket: TicketDetail,
) {
  if (role === "ADMIN") {
    return getAllowedStatusTargets(role, ticket).length > 0;
  }

  if (role !== "STAFF") {
    return false;
  }

  return (
    ticket.assignedStaffUserId === currentUserId &&
    getAllowedStatusTargets(role, ticket).length > 0
  );
}

export function describeTicketScope(role: RoleCode) {
  switch (role) {
    case "ADMIN":
      return "All maintenance and incident tickets";
    case "STAFF":
      return "Tickets assigned to you and issues you reported";
    case "STUDENT":
      return "Tickets you reported and can track to completion";
  }
}

export function getLocationLabel(location: TicketLocationOption) {
  const parts = [location.name, location.building, location.floor, location.roomIdentifier].filter(
    Boolean,
  );
  return parts.join(" / ");
}

export function getResourceLabel(resource: TicketResourceOption) {
  const parts = [resource.name, resource.resourceCode, resource.locationName].filter(Boolean);
  return parts.join(" / ");
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

export function isOldTicket(
  ticket: { createdAt: string },
  nowMs = Date.now(),
  thresholdDays = OLD_TICKET_AGE_DAYS,
) {
  const createdAtMs = parseDateValue(ticket.createdAt);
  if (createdAtMs == null) {
    return false;
  }

  return nowMs - createdAtMs >= thresholdDays * 24 * 60 * 60 * 1000;
}

export function isArchivedTicket(ticket: { createdAt: string; status: TicketStatus }) {
  return ticket.status === "CLOSED";
}

export function filterTicketsByAge<T extends { createdAt: string; status: TicketStatus }>(
  tickets: T[],
  age: TicketAgeFilter,
  nowMs = Date.now(),
) {
  switch (age) {
    case "NEW":
      return tickets.filter((ticket) => !isOldTicket(ticket, nowMs));
    case "OLD":
      return tickets.filter(
        (ticket) => isOldTicket(ticket, nowMs) && !isArchivedTicket(ticket),
      );
    case "ARCHIVED":
      return tickets.filter((ticket) => isArchivedTicket(ticket));
    default:
      return tickets;
  }
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

export function getAwaitingFirstResponseCount(
  tickets: Array<{ status: TicketStatus; firstRespondedAt: string | null }>,
) {
  return tickets.filter(
    (ticket) => !ticket.firstRespondedAt && !["CLOSED", "REJECTED"].includes(ticket.status),
  ).length;
}

export function getSlaRiskTicketCount(tickets: TicketSlaRecord[], nowMs = Date.now()) {
  return tickets.filter((ticket) => {
    const firstResponse = getFirstResponseTimerState(ticket, nowMs);
    const resolution = getResolutionTimerState(ticket, nowMs);
    return firstResponse.tone === "danger" || resolution.tone === "danger";
  }).length;
}

export function getTicketProgressLabel(
  ticket: Pick<TicketDetail, "status" | "assignedStaffUserId"> & {
    reconsiderationRequestedAt?: string | null;
  },
) {
  switch (ticket.status) {
    case "OPEN":
      return ticket.assignedStaffUserId
        ? "Assigned and waiting for the first staff update."
        : "Waiting for admin assignment.";
    case "IN_PROGRESS":
      return "Staff work is actively in progress.";
    case "RESOLVED":
      return "Resolved by staff and waiting for admin closure.";
    case "CLOSED":
      return "Closed after resolution review.";
    case "REJECTED":
      return ticket.reconsiderationRequestedAt
        ? "Rejected by admin review and waiting for reconsideration."
        : "Rejected by admin review.";
  }
}

export function getSlaTargetLabel(
  priority: TicketPriority,
  timer: "firstResponse" | "resolution",
) {
  const minutes =
    timer === "firstResponse"
      ? TICKET_SLA_TARGETS[priority].firstResponseMinutes
      : TICKET_SLA_TARGETS[priority].resolutionMinutes;

  return formatDurationMs(minutes * 60 * 1000);
}

export function getFirstResponseTimerState(
  ticket: TicketSlaRecord,
  nowMs = Date.now(),
): TicketSlaTimerState {
  const createdAtMs = parseDateValue(ticket.createdAt);
  const firstRespondedAtMs = parseDateValue(ticket.firstRespondedAt);
  if (createdAtMs == null) {
    return { label: "Timing unavailable", tone: "neutral" };
  }

  if (firstRespondedAtMs != null) {
    return {
      label: `Responded in ${formatDurationMs(firstRespondedAtMs - createdAtMs)}`,
      tone: "success",
    };
  }

  const remainingMs =
    TICKET_SLA_TARGETS[ticket.priority].firstResponseMinutes * 60 * 1000 - (nowMs - createdAtMs);

  if (remainingMs >= 0) {
    return { label: `Due in ${formatDurationMs(remainingMs)}`, tone: "neutral" };
  }

  return { label: `Overdue by ${formatDurationMs(Math.abs(remainingMs))}`, tone: "danger" };
}

export function getResolutionTimerState(
  ticket: TicketSlaRecord,
  nowMs = Date.now(),
): TicketSlaTimerState {
  const createdAtMs = parseDateValue(ticket.createdAt);
  const resolvedAtMs = parseDateValue(ticket.resolvedAt);
  if (createdAtMs == null) {
    return { label: "Timing unavailable", tone: "neutral" };
  }

  if (resolvedAtMs != null) {
    return {
      label: `Resolved in ${formatDurationMs(resolvedAtMs - createdAtMs)}`,
      tone: "success",
    };
  }

  if (ticket.status === "REJECTED") {
    return { label: "Stopped after admin rejection", tone: "neutral" };
  }

  const remainingMs =
    TICKET_SLA_TARGETS[ticket.priority].resolutionMinutes * 60 * 1000 - (nowMs - createdAtMs);

  if (remainingMs >= 0) {
    return { label: `Due in ${formatDurationMs(remainingMs)}`, tone: "neutral" };
  }

  return { label: `Overdue by ${formatDurationMs(Math.abs(remainingMs))}`, tone: "danger" };
}

export function getActiveTicketCategories(categories: TicketCategorySummary[]) {
  return categories.filter((category) => category.isActive);
}

export function getActiveStaffOptions(users: AdminUserSummary[]) {
  return users.filter((user) => user.status === "ACTIVE");
}

function parseDateValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function formatDurationMs(durationMs: number) {
  const totalMinutes = Math.max(0, Math.round(durationMs / 60000));
  if (totalMinutes <= 1) {
    return "1m";
  }

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return `${minutes}m`;
}
