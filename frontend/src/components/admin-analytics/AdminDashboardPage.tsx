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
      return "text-emerald-700";
    case "down":
      return "text-rose-700";
    default:
      return "text-slate-600";
  }
}

function getSeverityTone(severity: string) {
  switch (severity) {
    case "high":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export function AdminDashboardPage({
  overview,
  insights,
  displayName,
}: AdminDashboardPageProps) {
  return (
    <section className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
        <div className="relative">
          <div className="hero-glow hero-glow-left" />
          <div className="hero-glow hero-glow-right" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Admin intelligence dashboard
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                Campus command center
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">
                Track demand, auth health, ticket pressure, and notification backlog from one
                place, with Gemini-ready insights layered on top of trusted backend metrics.
              </p>
              <p className="mt-6 text-sm font-medium text-slate-700">
                Signed in as {displayName}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/analytics"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open analytics workspace
              </Link>
              <Link
                href="/users"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Review users
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {overview.metrics.map((metric) => (
          <Link
            key={metric.id}
            href={metric.href}
            className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]"
          >
            <p className="text-sm font-medium text-slate-600">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {metric.value}
            </p>
            <p className={`mt-3 text-sm font-medium ${getTrendTone(metric.trend)}`}>
              {metric.changeLabel}
            </p>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
        <section className="space-y-4 rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                AI briefing
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Gemini insight layer
              </h2>
            </div>
            <Link
              href="/analytics"
              className="text-sm font-semibold text-accent transition hover:text-accent-strong"
            >
              Ask more
            </Link>
          </div>

          {insights.available ? (
            <>
              <p className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-900">
                {insights.summary}
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Highlights
                  </p>
                  <div className="mt-3 space-y-3">
                    {insights.highlights.slice(0, 3).map((item) => (
                      <p key={item.text} className="text-sm leading-7 text-slate-700">
                        {item.text}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Anomalies
                  </p>
                  <div className="mt-3 space-y-3">
                    {insights.anomalies.length > 0 ? (
                      insights.anomalies.slice(0, 3).map((item) => (
                        <p key={item.text} className="text-sm leading-7 text-slate-700">
                          {item.text}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm leading-7 text-slate-600">
                        No unusual spikes were highlighted in this pass.
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Next questions
                  </p>
                  <div className="mt-3 space-y-3">
                    {insights.followUpQuestions.slice(0, 3).map((question) => (
                      <p key={question} className="text-sm leading-7 text-slate-700">
                        {question}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="rounded-[1.2rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
              {insights.message}
            </p>
          )}
        </section>

        <section className="space-y-4">
          <section className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Health flags
            </p>
            <div className="mt-4 space-y-3">
              {overview.alerts.length > 0 ? (
                overview.alerts.map((alert) => (
                  <Link
                    key={alert.id}
                    href={alert.href}
                    className={`block rounded-[1.2rem] border px-4 py-4 text-sm leading-7 transition hover:shadow-sm ${getSeverityTone(alert.severity)}`}
                  >
                    <p className="font-semibold">{alert.title}</p>
                    <p className="mt-1">{alert.message}</p>
                  </Link>
                ))
              ) : (
                <p className="rounded-[1.2rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
                  No active health flags were generated for this window.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Quick actions
            </p>
            <div className="mt-4 space-y-3">
              {overview.quickLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="block rounded-[1.2rem] border border-slate-200 bg-slate-50/70 px-4 py-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <p className="text-sm font-semibold text-slate-900">{link.label}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{link.description}</p>
                </Link>
              ))}
            </div>
          </section>
        </section>
      </div>
    </section>
  );
}
