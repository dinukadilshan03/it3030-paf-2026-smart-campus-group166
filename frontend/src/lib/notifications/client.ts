import { clientApiFetch } from "@/lib/api/client";
import { buildNotificationQuery } from "@/lib/notifications/shared";
import type {
  NotificationSummary,
  UnreadNotificationCountResponse,
} from "@/lib/notifications/types";

async function ensureOk(response: Response, fallbackMessage: string) {
  if (response.ok) {
    return;
  }

  let message = fallbackMessage;
  try {
    const payload = (await response.json()) as { message?: string };
    if (payload.message) {
      message = payload.message;
    }
  } catch {
    // Use fallback message when the backend payload cannot be parsed.
  }

  throw new Error(message);
}

export async function listNotificationsClient(filters: { limit?: number; unreadOnly?: boolean } = {}) {
  const response = await clientApiFetch(
    `/api/v1/notifications${buildNotificationQuery(filters)}`,
    { cache: "no-store" },
  );
  await ensureOk(response, "Could not load notifications.");
  return ((await response.json()) as NotificationSummary[]) ?? [];
}

export async function getUnreadNotificationCountClient() {
  const response = await clientApiFetch("/api/v1/notifications/unread-count", {
    cache: "no-store",
  });
  await ensureOk(response, "Could not load the unread notification count.");
  return (await response.json()) as UnreadNotificationCountResponse;
}

export async function markNotificationReadClient(id: number) {
  const response = await clientApiFetch(`/api/v1/notifications/${id}/read`, {
    method: "PATCH",
  });
  await ensureOk(response, "Could not mark the notification as read.");
  return (await response.json()) as NotificationSummary;
}

export async function markAllNotificationsReadClient() {
  const response = await clientApiFetch("/api/v1/notifications/read-all", {
    method: "PATCH",
  });
  await ensureOk(response, "Could not mark all notifications as read.");
}
