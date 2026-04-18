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
    <div className="min-h-screen bg-[#f4efe7] px-3 py-3 text-stone-900 md:px-4 md:py-4">
      <div className="grid min-h-[calc(100vh-1.5rem)] grid-cols-1 gap-4 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="hidden xl:flex xl:flex-col">
          <div className="flex h-full flex-col rounded-[2rem] border border-stone-200 bg-[#ede7de] p-6 shadow-[0_18px_44px_rgba(38,33,28,0.05)]">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-stone-500">
                SmartCampus
              </p>
              <h1 className="mt-4 text-[1.75rem] font-semibold tracking-[-0.04em] text-stone-900">
                Role workspace
              </h1>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                A structured navigation shell for campus operations, support, and oversight.
              </p>
            </div>

            <div className="mt-8">
              <SidebarNav items={navItems} />
            </div>

            <div className="mt-auto rounded-[1.5rem] border border-stone-200 bg-white p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
                Signed in
              </p>
              <p className="mt-2 text-sm font-semibold text-stone-900">
                {displayName}
              </p>
              <p className="mt-1 text-sm text-stone-600">{getRoleLabel(user.role)}</p>
            </div>
          </div>
        </aside>

        <div className="flex min-h-[calc(100vh-1.5rem)] flex-col rounded-[2rem] border border-stone-200 bg-[#fbf8f3] shadow-[0_24px_58px_rgba(38,33,28,0.06)]">
          <header className="border-b border-stone-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-stone-500">
                  Protected workspace
                </p>
                <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="text-[1.9rem] font-semibold tracking-[-0.04em] text-stone-900">
                      {getRoleLabel(user.role)}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-600">
                      Focus the page on clear actions, readable sections, and the next task that matters.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="text-left lg:text-right">
                  <p className="text-sm font-semibold text-stone-900">
                    {displayName}
                  </p>
                  <p className="text-sm text-stone-600">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <NotificationBell initialUnreadCount={initialUnreadNotificationCount} />
                  <LogoutButton />
                </div>
              </div>
            </div>

            <div className="mt-4 xl:hidden">
              <SidebarNav items={navItems} orientation="horizontal" />
            </div>
          </header>

          <main className="flex-1 px-4 py-5 md:px-6 md:py-6">
            <div className="w-full max-w-none">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
