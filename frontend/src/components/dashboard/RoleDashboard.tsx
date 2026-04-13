import { QuickLinkCard } from "@/components/dashboard/QuickLinkCard";
import type { CurrentUser, DashboardDefinition } from "@/types/auth";

type RoleDashboardProps = {
  user: CurrentUser;
  definition: DashboardDefinition;
};

export function RoleDashboard({ user, definition }: RoleDashboardProps) {
  const displayName = user.displayName || user.email || "SmartCampus user";

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {definition.badge}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
          {definition.heading}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          {definition.description}
        </p>
        <p className="mt-6 text-sm font-medium text-slate-700">
          Signed in as {displayName}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {definition.cards.map((card) => (
          <QuickLinkCard
            key={card.href}
            title={card.title}
            href={card.href}
            description={card.description}
          />
        ))}
      </div>
    </section>
  );
}
