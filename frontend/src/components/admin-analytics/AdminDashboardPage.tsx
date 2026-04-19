import Link from "next/link";
import type {
  AdminAnalyticsInsightResponse,
  AdminAnalyticsOverview,
} from "@/lib/admin-analytics/types";

type AdminDashboardPageProps = {
  overview: AdminAnalyticsOverview;
  insights: AdminAnalyticsInsightResponse;
  displayName: string;
};

function getTrendTone(trend: string) {
  switch (trend) {
    case "up":
      return "text-lime-800";
    case "down":
      return "text-orange-800";
    default:
      return "text-stone-600";
  }
}

function getSeverityTone(severity: string) {
  switch (severity) {
    case "high":
      return "border-orange-300 bg-orange-50 text-orange-900";
    case "medium":
      return "border-amber-300 bg-amber-50 text-amber-900";
    default:
      return "border-stone-200 bg-stone-50 text-stone-700";
  }
}

export function AdminDashboardPage({
  overview,
  insights,
  displayName,
}: AdminDashboardPageProps) {
  return (
    <section className="space-y-6 text-stone-900">
      <section className="rounded-[2.1rem] border border-stone-200 bg-[linear-gradient(135deg,#fffdfa,#f2ebe2)] p-7 shadow-[0_24px_58px_rgba(38,33,28,0.06)] md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-stone-500">
              Admin dashboard
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-stone-900 md:text-[3.35rem]">
              Run campus oversight from one command surface.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-stone-600">
              Track platform demand, operational pressure, and management follow-up in a layout
              that prioritizes signal over decoration.
            </p>
          </div>

          <div className="xl:max-w-sm xl:text-right">
            <p className="text-sm font-medium text-stone-900">Signed in as {displayName}</p>
            <p className="mt-2 text-sm leading-7 text-stone-600">
              Use this dashboard for fast oversight, then move into deeper analysis when needed.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row xl:justify-end">
              <Link
                href="/analytics"
                className="inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold !text-white no-underline transition hover:bg-stone-800 hover:!text-white visited:!text-white focus-visible:!text-white"
              >
                <span className="!text-white">Open analytics</span>
              </Link>
              <Link
                href="/users"
                className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold !text-stone-900 no-underline transition hover:bg-stone-50 hover:!text-stone-900 visited:!text-stone-900 focus-visible:!text-stone-900"
              >
                <span className="!text-stone-900">Review users</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {overview.metrics.map((metric) => (
          <Link
            key={metric.id}
            href={metric.href}
            className="rounded-[1.6rem] border border-stone-200 bg-[#fffdfa] p-5 shadow-[0_14px_34px_rgba(38,33,28,0.05)] transition hover:border-stone-300 hover:bg-white"
          >
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
              {metric.label}
            </p>
            <p className="mt-3 text-[1.95rem] font-semibold tracking-[-0.04em] text-stone-900">
              {metric.value}
            </p>
            <p className={`mt-3 text-sm font-medium ${getTrendTone(metric.trend)}`}>
              {metric.changeLabel}
            </p>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.8fr)]">
        <div className="space-y-6">
          <section className="rounded-[1.9rem] border border-stone-200 bg-[#fffdfa] p-6 shadow-[0_18px_44px_rgba(38,33,28,0.05)]">
            <div className="flex flex-col gap-2 border-b border-stone-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
                  Intelligence layer
                </p>
                <h2 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.03em] text-stone-900">
                  Operational briefing
                </h2>
              </div>
              <Link
                href="/analytics"
                className="text-sm font-semibold text-stone-900 transition hover:opacity-80"
              >
                Open detailed analytics
              </Link>
            </div>

            {insights.available ? (
              <div className="mt-5 space-y-5">
                <p className="rounded-[1.35rem] border border-lime-300 bg-lime-50 px-4 py-4 text-sm leading-7 text-lime-900">
                  {insights.summary}
                </p>
                <div className="grid gap-4 xl:grid-cols-3">
                  <div className="rounded-[1.25rem] border border-stone-200 bg-white p-4">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-stone-500">
                      Highlights
                    </p>
                    <div className="mt-3 space-y-3">
                      {insights.highlights.slice(0, 3).map((item) => (
                        <p key={item.text} className="text-sm leading-7 text-stone-600">
                          {item.text}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[1.25rem] border border-stone-200 bg-white p-4">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-stone-500">
                      Anomalies
                    </p>
                    <div className="mt-3 space-y-3">
                      {insights.anomalies.length > 0 ? (
                        insights.anomalies.slice(0, 3).map((item) => (
                          <p key={item.text} className="text-sm leading-7 text-stone-600">
                            {item.text}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm leading-7 text-stone-600">
                          No unusual spikes were highlighted in this pass.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-[1.25rem] border border-stone-200 bg-white p-4">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-stone-500">
                      Next questions
                    </p>
                    <div className="mt-3 space-y-3">
                      {insights.followUpQuestions.slice(0, 3).map((question) => (
                        <p key={question} className="text-sm leading-7 text-stone-600">
                          {question}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-5 rounded-[1.25rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm leading-7 text-stone-600">
                {insights.message}
              </p>
            )}
          </section>

          <section className="rounded-[1.9rem] border border-stone-200 bg-[#fffdfa] p-6 shadow-[0_18px_44px_rgba(38,33,28,0.05)]">
            <div className="flex flex-col gap-2 border-b border-stone-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
                  Management actions
                </p>
                <h2 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.03em] text-stone-900">
                  Jump into critical admin areas
                </h2>
              </div>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {overview.quickLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="rounded-[1.35rem] border border-stone-200 bg-white px-4 py-4 transition hover:border-stone-300 hover:bg-stone-50"
                >
                  <p className="text-sm font-semibold text-stone-900">{link.label}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-600">{link.description}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[1.75rem] border border-stone-200 bg-[#f8f4ee] p-5 shadow-[0_14px_36px_rgba(38,33,28,0.04)]">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-stone-900">
              Health flags
            </h2>
            <div className="mt-4 space-y-3">
              {overview.alerts.length > 0 ? (
                overview.alerts.map((alert) => (
                  <Link
                    key={alert.id}
                    href={alert.href}
                    className={`block rounded-[1.15rem] border px-4 py-4 text-sm leading-7 transition hover:border-stone-300 ${getSeverityTone(alert.severity)}`}
                  >
                    <p className="font-semibold">{alert.title}</p>
                    <p className="mt-1">{alert.message}</p>
                  </Link>
                ))
              ) : (
                <p className="rounded-[1rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm leading-7 text-stone-600">
                  No active health flags were generated for this window.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-stone-200 bg-[#f8f4ee] p-5 shadow-[0_14px_36px_rgba(38,33,28,0.04)]">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-stone-900">
              Dashboard posture
            </h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-[1.15rem] border border-stone-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-stone-900">Oversight first</p>
                <p className="mt-2 text-sm leading-7 text-stone-600">
                  The landing page emphasizes quick signal and routing, while deeper analysis stays
                  in the analytics workspace.
                </p>
              </div>
              <div className="rounded-[1.15rem] border border-lime-300 bg-lime-50 px-4 py-4">
                <p className="text-sm font-semibold text-stone-900">Layout discipline</p>
                <p className="mt-2 text-sm leading-7 text-stone-600">
                  Admin information is grouped into one lead column and one support rail instead of
                  equal-weight cards.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
