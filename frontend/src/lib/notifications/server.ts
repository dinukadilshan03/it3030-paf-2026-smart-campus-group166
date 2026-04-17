import { serverApiFetch } from "@/lib/api/server";
import { buildNotificationQuery } from "@/lib/notifications/shared";
import type {
  NotificationSummary,
  UnreadNotificationCountResponse,
} from "@/lib/notifications/types";

export async function listNotificationsServer(filters: { limit?: number; unreadOnly?: boolean } = {}) {
  const response = await serverApiFetch(
    `/api/v1/notifications${buildNotificationQuery(filters)}`,
  );

  if (!response.ok) {
    throw new Error("Could not load notifications.");
  }

  return ((await response.json()) as NotificationSummary[]) ?? [];
}

export async function getUnreadNotificationCountServer() {
  const response = await serverApiFetch("/api/v1/notifications/unread-count");

  if (!response.ok) {
    throw new Error("Could not load the unread notification count.");
  }

  return (await response.json()) as UnreadNotificationCountResponse;
}
