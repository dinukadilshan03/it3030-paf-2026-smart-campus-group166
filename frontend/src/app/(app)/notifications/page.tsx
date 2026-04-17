import { NotificationCenterPage } from "@/components/notifications/NotificationCenterPage";
import { requireRole } from "@/lib/auth/session";
import {
  getUnreadNotificationCountServer,
  listNotificationsServer,
} from "@/lib/notifications/server";

export default async function NotificationsPage() {
  await requireRole(["STUDENT", "STAFF", "ADMIN"]);

  const [notifications, unreadCount] = await Promise.all([
    listNotificationsServer(),
    getUnreadNotificationCountServer(),
  ]);

  return (
    <NotificationCenterPage
      initialNotifications={notifications}
      initialUnreadCount={unreadCount.unreadCount}
    />
  );
}
