import { AppShell } from "@/components/layout/AppShell";
import { requireCurrentUser } from "@/lib/auth/session";
import { getNavigationForRole } from "@/lib/navigation/nav-items";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireCurrentUser();
  const navItems = getNavigationForRole(user.role);

  return (
    <AppShell user={user} navItems={navItems}>
      {children}
    </AppShell>
  );
}
