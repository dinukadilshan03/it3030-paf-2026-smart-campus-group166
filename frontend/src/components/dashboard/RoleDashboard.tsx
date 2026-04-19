import Link from "next/link";
import type {
  CurrentUser,
  DashboardDefinition,
  DashboardListItem,
  DashboardPanel,
} from "@/types/auth";

type RoleDashboardProps = {
  user: CurrentUser;
  definition: DashboardDefinition;
};

function getToneClasses(tone?: DashboardListItem["tone"]) {
  switch (tone) {
    case "accent":
      return "border-lime-300 bg-lime-50";
    case "warning":
      return "border-orange-300 bg-orange-50";
    case "muted":
      return "border-stone-200 bg-stone-50";
    default:
      return "border-stone-200 bg-white";
  }
}

function ActionCard({
  title,
  href,
  description,
  eyebrow,
  meta,
}: {
  title: string;
  href: string;
  description: string;
  eyebrow?: string;
  meta?: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-[0_18px_44px_rgba(38,33,28,0.06)] transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_24px_56px_rgba(38,33,28,0.1)]"
    >
      {eyebrow ? (
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
          {eyebrow}
        </p>
      ) : null}
      <div className="mt-3 flex items-start justify-between gap-5">
        <h3 className="max-w-[18rem] text-[1.65rem] font-semibold tracking-[-0.03em] text-stone-900">
          {title}
        </h3>
        <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-stone-200 bg-stone-50 px-3 text-sm text-stone-900 transition group-hover:bg-lime-50">
          Open
        </span>
      </div>
      <p className="mt-4 text-sm leading-7 text-stone-600">{description}</p>
      {meta ? (
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          {meta}
        </p>
      ) : null}
    </Link>
  );
}

function ListBlock({
  title,
  description,
  items,
  columns = 1,
}: {
  title: string;
  description?: string;
  items: DashboardListItem[];
  columns?: 1 | 2;
}) {
  return (
    <section className="rounded-[1.9rem] border border-stone-200 bg-[#fffdfa] p-6 shadow-[0_18px_44px_rgba(38,33,28,0.05)]">
      <div className="flex flex-col gap-2 border-b border-stone-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-stone-900">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-7 text-stone-600">{description}</p>
          ) : null}
        </div>
      </div>

      <div className={`mt-5 grid gap-4 ${columns === 2 ? "xl:grid-cols-2" : ""}`}>
        {items.map((item) => (
          <Link
            key={`${item.href}-${item.title}`}
            href={item.href}
            className={`rounded-[1.35rem] border px-4 py-4 transition hover:border-stone-300 hover:bg-stone-50 ${getToneClasses(item.tone)}`}
          >
            {item.eyebrow ? (
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-stone-500">
                {item.eyebrow}
              </p>
            ) : null}
            <div className="mt-2 flex items-start justify-between gap-4">
              <h3 className="text-base font-semibold text-stone-900">{item.title}</h3>
              {item.meta ? (
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  {item.meta}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-7 text-stone-600">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SecondaryPanels({ panels }: { panels: DashboardPanel[] }) {
  return (
    <div className="space-y-4">
      {panels.map((panel) => (
        <section
          key={panel.title}
          className="rounded-[1.75rem] border border-stone-200 bg-[#f8f4ee] p-5 shadow-[0_14px_36px_rgba(38,33,28,0.04)]"
        >
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-stone-900">
            {panel.title}
          </h2>
          {panel.description ? (
            <p className="mt-2 text-sm leading-7 text-stone-600">{panel.description}</p>
          ) : null}
          <div className="mt-4 space-y-3">
            {panel.items.map((item) => (
              <Link
                key={`${panel.title}-${item.title}`}
                href={item.href}
                className={`block rounded-[1.15rem] border px-4 py-4 transition hover:border-stone-300 ${getToneClasses(item.tone)}`}
              >
                {item.eyebrow ? (
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-stone-500">
                    {item.eyebrow}
                  </p>
                ) : null}
                <p className="mt-2 text-sm font-semibold text-stone-900">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-stone-600">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function RoleDashboard({ user, definition }: RoleDashboardProps) {
  const displayName = user.displayName || user.email || "SmartCampus user";
  const hero = definition.sections.find((section) => section.type === "hero");
  const metrics = definition.sections.find((section) => section.type === "metrics");
  const mainSections = definition.sections.filter(
    (section) =>
      section.type !== "hero" &&
      section.type !== "metrics" &&
      ("placement" in section ? (section.placement ?? "main") === "main" : false),
  );
  const railSections = definition.sections.filter(
    (section) =>
      section.type !== "hero" &&
      section.type !== "metrics" &&
      ("placement" in section ? section.placement === "rail" : false),
  );

  return (
    <section className="space-y-6 text-stone-900">
      {hero && hero.type === "hero" ? (
        <section className="rounded-[2.1rem] border border-stone-200 bg-[linear-gradient(135deg,#fffdfa,#f2ebe2)] p-7 shadow-[0_24px_58px_rgba(38,33,28,0.06)] md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-stone-500">
                {hero.eyebrow}
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-stone-900 md:text-[3.35rem]">
                {hero.title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-stone-600">
                {hero.description}
              </p>
            </div>

            <div className="min-w-0 xl:max-w-sm xl:text-right">
              <p className="text-sm font-medium text-stone-900">Signed in as {displayName}</p>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                A structured landing page for the work most relevant to this role.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row xl:justify-end">
                {hero.cta ? (
                  <Link
                    href={hero.cta.href}
                    className="inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold !text-white no-underline transition hover:bg-stone-800 hover:!text-white visited:!text-white focus-visible:!text-white"
                  >
                    <span className="!text-white">{hero.cta.label}</span>
                  </Link>
                ) : null}
                {hero.secondaryCta ? (
                  <Link
                    href={hero.secondaryCta.href}
                    className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold !text-stone-900 no-underline transition hover:bg-stone-50 hover:!text-stone-900 visited:!text-stone-900 focus-visible:!text-stone-900"
                  >
                    <span className="!text-stone-900">{hero.secondaryCta.label}</span>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {metrics && metrics.type === "metrics" ? (
        <section className="grid gap-4 lg:grid-cols-3">
          {metrics.items.map((metric) => {
            const content = (
              <>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
                  {metric.label}
                </p>
                <p className="mt-3 text-[1.85rem] font-semibold tracking-[-0.04em] text-stone-900">
                  {metric.value}
                </p>
                <p className="mt-3 text-sm leading-7 text-stone-600">{metric.detail}</p>
              </>
            );

            if (metric.href) {
              return (
                <Link
                  key={metric.label}
                  href={metric.href}
                  className="rounded-[1.6rem] border border-stone-200 bg-[#fffdfa] p-5 shadow-[0_14px_34px_rgba(38,33,28,0.05)] transition hover:border-stone-300 hover:bg-white"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={metric.label}
                className="rounded-[1.6rem] border border-stone-200 bg-[#fffdfa] p-5 shadow-[0_14px_34px_rgba(38,33,28,0.05)]"
              >
                {content}
              </div>
            );
          })}
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.78fr)]">
        <div className="space-y-6">
          {mainSections.map((section, index) => {
            if (section.type === "primaryActions") {
              return (
                <section
                  key={`${section.type}-${index}`}
                  className="rounded-[1.9rem] border border-stone-200 bg-[#fffdfa] p-6 shadow-[0_18px_44px_rgba(38,33,28,0.05)]"
                >
                  <div className="flex flex-col gap-2 border-b border-stone-200 pb-4">
                    <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-stone-900">
                      {section.title}
                    </h2>
                    {section.description ? (
                      <p className="max-w-2xl text-sm leading-7 text-stone-600">
                        {section.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {section.items.map((item) => (
                      <ActionCard key={item.href} {...item} />
                    ))}
                  </div>
                </section>
              );
            }

            if (section.type === "activity" || section.type === "alerts" || section.type === "lists") {
              return (
                <ListBlock
                  key={`${section.type}-${index}`}
                  title={section.title}
                  description={section.description}
                  items={section.items}
                  columns={section.type === "lists" ? section.columns : 1}
                />
              );
            }

            return null;
          })}
        </div>

        <aside className="space-y-4">
          {railSections.map((section, index) => {
            if (section.type === "secondaryPanels") {
              return <SecondaryPanels key={`${section.type}-${index}`} panels={section.panels} />;
            }

            if (section.type === "activity" || section.type === "alerts" || section.type === "lists") {
              return (
                <ListBlock
                  key={`${section.type}-${index}`}
                  title={section.title}
                  description={section.description}
                  items={section.items}
                  columns={1}
                />
              );
            }

            if (section.type === "primaryActions") {
              return (
                <section
                  key={`${section.type}-${index}`}
                  className="rounded-[1.9rem] border border-stone-200 bg-[#fffdfa] p-6 shadow-[0_18px_44px_rgba(38,33,28,0.05)]"
                >
                  <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-stone-900">
                    {section.title}
                  </h2>
                  {section.description ? (
                    <p className="mt-2 text-sm leading-7 text-stone-600">{section.description}</p>
                  ) : null}
                  <div className="mt-5 space-y-4">
                    {section.items.map((item) => (
                      <ActionCard key={item.href} {...item} />
                    ))}
                  </div>
                </section>
              );
            }

            return null;
          })}
        </aside>
      </div>
    </section>
  );
}
