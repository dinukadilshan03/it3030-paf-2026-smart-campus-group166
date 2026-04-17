import type { NotificationSummary } from "@/lib/notifications/types";

export function buildNotificationQuery(filters: { limit?: number; unreadOnly?: boolean } = {}) {
  const params = new URLSearchParams();

  if (typeof filters.limit === "number") {
    params.set("limit", String(filters.limit));
  }

  if (filters.unreadOnly) {
    params.set("unreadOnly", "true");
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function getNotificationHref(notification: NotificationSummary) {
  if (notification.referenceType === "BOOKING" && notification.referenceId != null) {
    return `/bookings?bookingId=${notification.referenceId}`;
  }

  if (notification.referenceType === "TICKET" && notification.referenceId != null) {
    return `/tickets?ticketId=${notification.referenceId}`;
  }

  return "/notifications";
}

export function formatNotificationDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
