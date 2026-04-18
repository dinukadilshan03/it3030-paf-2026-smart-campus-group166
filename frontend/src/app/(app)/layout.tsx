import { AppShell } from "@/components/layout/AppShell";
import { requireCurrentUser } from "@/lib/auth/session";
import { getNavigationForRole } from "@/lib/navigation/nav-items";
import { getUnreadNotificationCountServer } from "@/lib/notifications/server";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireCurrentUser();
  const navItems = getNavigationForRole(user.role);
  const unreadNotificationCount = await getUnreadNotificationCountServer();

  return (
    <AppShell
      user={user}
      navItems={navItems}
      initialUnreadNotificationCount={unreadNotificationCount.unreadCount}
    >
      {children}
    </AppShell>
  );
}
