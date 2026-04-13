import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { requireRole } from "@/lib/auth/session";

export default async function NotificationsPage() {
  await requireRole(["ADMIN"]);

  return (
    <PagePlaceholder
      eyebrow="Future workflow"
      title="Notifications"
      description="This placeholder page is in place so the notification experience can be added later without changing the core app shell."
    />
  );
}
