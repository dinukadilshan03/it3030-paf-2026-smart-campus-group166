import { LogoutButton } from "@/components/layout/LogoutButton";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SidebarNav } from "@/components/layout/SidebarNav";
import type { CurrentUser, NavItem } from "@/types/auth";

type AppShellProps = {
  user: CurrentUser;
  navItems: NavItem[];
  initialUnreadNotificationCount: number;
  children: React.ReactNode;
};

function getRoleLabel(role: CurrentUser["role"]) {
  switch (role) {
    case "ADMIN":
      return "Admin dashboard";
    case "STAFF":
      return "Staff dashboard";
    case "STUDENT":
      return "Student dashboard";
    default:
      return "SmartCampus";
  }
}

export function AppShell({
  user,
  navItems,
  initialUnreadNotificationCount,
  children,
}: AppShellProps) {
  const displayName = user.displayName || user.email || "SmartCampus user";

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl overflow-visible rounded-[2rem] border border-white/70 bg-white/60 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur md:min-h-[calc(100vh-3rem)]">
        <aside className="hidden w-72 flex-col border-r border-slate-200/80 bg-slate-100/70 p-6 md:flex">
          <div className="space-y-3">
            <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              SmartCampus
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                Role navigation
              </h1>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                A role-aware shell for your team to plug feature pages into
                without changing the app flow later.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <SidebarNav items={navItems} />
          </div>

          <div className="mt-auto rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Signed in
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">{displayName}</p>
            <p className="mt-1 text-sm text-slate-600">{getRoleLabel(user.role)}</p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col overflow-visible">
          <header className="relative z-20 border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  SmartCampus shell
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                  {getRoleLabel(user.role)}
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Navigate into the placeholder pages available for this role.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
                <div className="text-left md:text-right">
                  <p className="text-sm font-medium text-slate-900">{displayName}</p>
                  <p className="text-sm text-slate-600">{user.email}</p>
                </div>
                <NotificationBell initialUnreadCount={initialUnreadNotificationCount} />
                <LogoutButton />
              </div>
            </div>

            <div className="mt-4 md:hidden">
              <SidebarNav items={navItems} orientation="horizontal" />
            </div>
          </header>

          <main className="relative z-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
