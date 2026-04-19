"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  askAdminAnalyticsClient,
  getAdminAnalyticsChartsClient,
  getAdminAnalyticsHealthClient,
  getAdminAnalyticsInsightsClient,
  getAdminAnalyticsOverviewClient,
} from "@/lib/admin-analytics/client";
import type {
  AdminAnalyticsAskResponse,
  AdminAnalyticsChartBundle,
  AdminAnalyticsHealth,
  AdminAnalyticsInsightResponse,
  AdminAnalyticsOverview,
  AnalyticsNamedValue,
  AnalyticsRange,
  AnalyticsSeriesPoint,
} from "@/lib/admin-analytics/types";
import {
  DualLineTrendChart,
  IntensityStrip,
  RankedBarChart,
  ShareBreakdown,
  type IntensityPoint,
  type ShareSlice,
  type TrendPoint,
} from "./ChartPrimitives";

type AdminAnalyticsWorkspaceProps = {
  initialRange: AnalyticsRange;
  initialOverview: AdminAnalyticsOverview;
  initialCharts: AdminAnalyticsChartBundle;
  initialHealth: AdminAnalyticsHealth;
  initialInsights: AdminAnalyticsInsightResponse;
};

const RANGE_OPTIONS: AnalyticsRange[] = ["7D", "30D", "90D"];
const MIX_OPTIONS = [
  { id: "ticketCategories", label: "Ticket categories", href: "/tickets" },
  { id: "notificationTypes", label: "Notification types", href: "/notifications" },
  { id: "authEventsByType", label: "Auth events", href: "/analytics" },
] as const;

type MixOptionId = (typeof MIX_OPTIONS)[number]["id"];

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

export function AdminAnalyticsWorkspace({
  initialRange,
  initialOverview,
  initialCharts,
  initialHealth,
  initialInsights,
}: AdminAnalyticsWorkspaceProps) {
  const [range, setRange] = useState<AnalyticsRange>(initialRange);
  const [overview, setOverview] = useState(initialOverview);
  const [charts, setCharts] = useState(initialCharts);
  const [health, setHealth] = useState(initialHealth);
  const [insights, setInsights] = useState(initialInsights);
  const [askResponse, setAskResponse] = useState<AdminAnalyticsAskResponse | null>(null);
  const [question, setQuestion] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mixMode, setMixMode] = useState<MixOptionId>("ticketCategories");
  const [isPending, startTransition] = useTransition();
  const [isAsking, startAskTransition] = useTransition();

  const refreshRange = (nextRange: AnalyticsRange) => {
    startTransition(async () => {
      try {
        setErrorMessage(null);
        const [nextOverview, nextCharts, nextHealth, nextInsights] = await Promise.all([
          getAdminAnalyticsOverviewClient(nextRange),
          getAdminAnalyticsChartsClient(nextRange),
          getAdminAnalyticsHealthClient(nextRange),
          getAdminAnalyticsInsightsClient(nextRange),
        ]);
        setRange(nextRange);
        setOverview(nextOverview);
        setCharts(nextCharts);
        setHealth(nextHealth);
        setInsights(nextInsights);
        setAskResponse(null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Could not refresh analytics.");
      }
    });
  };

  const handleAsk = () => {
    startAskTransition(async () => {
      try {
        setErrorMessage(null);
        const nextResponse = await askAdminAnalyticsClient({ range, question });
        setAskResponse(nextResponse);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Could not answer the question.");
      }
    });
  };

  const trendData = buildTrendData(charts);
  const bookingIntensity = buildIntensityData(charts.peakBookingHours);
  const mixOption = MIX_OPTIONS.find((option) => option.id === mixMode) ?? MIX_OPTIONS[0];
  const mixData = buildShareSlices(charts[mixOption.id]);
  const authSummary = getNamedValue(health.authHealth, "auth_success_logins");
  const failedLogins = getNamedValue(health.authHealth, "auth_failed_logins");
  const unreadBacklog = getNamedValue(health.notificationHealth, "notification_unread_backlog");
  const readInWindow = getNamedValue(health.notificationHealth, "notification_read_activity");
  const generatedInWindow = getNamedValue(health.notificationHealth, "notification_created_window");
  const topLocations = charts.topLocations.map((item) => item.label);

  return (
    <section className="space-y-6">
      <section className="rounded-[1.85rem] border border-white/70 bg-white/90 p-8 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Admin analytics workspace
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Operational intelligence
            </h1>
            <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">
              Move from management views to operational signals with usage analytics, auth health,
              notification posture, and AI-assisted interpretation grounded in backend metrics.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                disabled={isPending}
                onClick={() => refreshRange(option)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  range === option
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </section>

      {errorMessage ? (
        <p className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {overview.metrics.map((metric) => (
          <Link
            key={metric.id}
            href={metric.href}
            className="rounded-[1.4rem] border border-white/70 bg-white/90 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
          >
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {metric.label}
            </p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <p className="text-3xl font-semibold tracking-tight text-slate-950">{metric.value}</p>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  metric.trend === "up"
                    ? "bg-emerald-50 text-emerald-800"
                    : metric.trend === "down"
                      ? "bg-rose-50 text-rose-800"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {metric.trend}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">{metric.changeLabel}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.85fr)]">
        <section className="space-y-6">
          <DualLineTrendChart
            title="Demand trend"
            description="Bookings and ticket intake across the selected window, aligned on the same timeline."
            data={trendData}
            href="/bookings"
          />

          <IntensityStrip
            title="Booking hour intensity"
            description="A compact read on where the day compresses into peak scheduling demand."
            data={bookingIntensity}
            href="/bookings"
          />

          <RankedBarChart
            title="Top resources"
            description="The most requested spaces and assets, with top locations folded in as supporting context."
            data={charts.topResources}
            href="/resources"
            supportingLabels={topLocations}
          />

          <section className="rounded-[1.6rem] border border-white/70 bg-white/92 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Operational mix
                </p>
                <h2 className="mt-2 text-[1.28rem] font-semibold tracking-[-0.03em] text-slate-950">
                  What is driving workload?
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Switch between the dominant issue, notification, and auth patterns without
                  adding more full-size charts.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {MIX_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setMixMode(option.id)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                      mixMode === option.id
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <ShareBreakdown
                title={mixOption.label}
                description="Distribution and ranked composition for the current operational lens."
                data={mixData}
                href={mixOption.href}
              />
            </div>
          </section>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[1.6rem] border border-white/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.98))] p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                System posture
              </p>
              <h2 className="mt-2 text-[1.28rem] font-semibold tracking-[-0.03em] text-slate-950">
                Auth and notification health
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                One place to judge whether access and messaging systems are healthy enough for the
                rest of the analytics to be trusted.
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <HealthStatCard
                label={authSummary?.label ?? "Successful logins"}
                value={authSummary?.value ?? "0"}
                tone="emerald"
              />
              <HealthStatCard
                label={failedLogins?.label ?? "Failed logins"}
                value={failedLogins?.value ?? "0"}
                tone="rose"
              />
            </div>

            <div className="mt-4 grid gap-3">
              <MiniHealthRow label={unreadBacklog?.label ?? "Unread backlog"} value={unreadBacklog?.value ?? "0"} />
              <MiniHealthRow label={readInWindow?.label ?? "Read in window"} value={readInWindow?.value ?? "0"} />
              <MiniHealthRow
                label={generatedInWindow?.label ?? "Generated in window"}
                value={generatedInWindow?.value ?? "0"}
              />
            </div>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Active flags
              </p>
              <div className="mt-3 space-y-3">
                {health.flags.length > 0 ? (
                  health.flags.map((flag) => (
                    <Link
                      key={flag.id}
                      href={flag.href}
                      className={`block rounded-[1rem] border px-4 py-4 text-sm leading-7 transition hover:shadow-sm ${getSeverityTone(flag.severity)}`}
                    >
                      <p className="font-semibold">{flag.title}</p>
                      <p className="mt-1">{flag.message}</p>
                    </Link>
                  ))
                ) : (
                  <p className="rounded-[1rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
                    No health flags are active in this window.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-white/70 bg-white/92 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Recent sign-ins
            </p>
            <div className="mt-4 space-y-3">
              {health.recentSignIns.map((user) => (
                <Link
                  key={user.id}
                  href={user.href}
                  className="flex items-center justify-between gap-4 rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{user.displayName}</p>
                    <p className="truncate text-sm text-slate-600">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {user.role ?? "UNASSIGNED"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(user.lastLoginAt))}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="rounded-[1.6rem] border border-white/70 bg-white/92 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                AI insights
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                AI summary layer
              </h2>
            </div>
          </div>

          {insights.available ? (
            <div className="mt-5 space-y-5">
              <p className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-900">
                {insights.summary}
              </p>
              <div className="grid gap-4 lg:grid-cols-3">
                <InsightColumn title="Highlights" items={insights.highlights.map((item) => item.text)} />
                <InsightColumn
                  title="Anomalies"
                  items={
                    insights.anomalies.length > 0
                      ? insights.anomalies.map((item) => item.text)
                      : ["No exceptional pattern was highlighted in this run."]
                  }
                />
                <InsightColumn
                  title="Recommendations"
                  items={insights.recommendations.map((item) => item.text)}
                />
              </div>
            </div>
          ) : (
            <p className="mt-5 rounded-[1.2rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
              {insights.message}
            </p>
          )}
        </section>

        <section className="space-y-6">
          <section className="rounded-[1.55rem] border border-white/70 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Ask the dashboard
            </p>
            <div className="mt-4 space-y-4">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={4}
                placeholder="Which operational risk should I pay attention to first?"
                className="w-full rounded-[1.2rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
              />
              <button
                type="button"
                disabled={isAsking || question.trim().length === 0}
                onClick={handleAsk}
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAsking ? "Asking AI..." : "Ask analytics"}
              </button>

              {insights.followUpQuestions.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Suggested prompts
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {insights.followUpQuestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setQuestion(suggestion)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {askResponse ? (
                askResponse.available ? (
                  <div className="space-y-4 rounded-[1.2rem] border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-sm leading-7 text-slate-700">{askResponse.answer}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Confidence {Math.round(askResponse.confidence * 100)}%
                    </p>
                    {askResponse.recommendedLinks.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {askResponse.recommendedLinks.map((link) => (
                          <Link
                            key={link.id}
                            href={link.href}
                            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="rounded-[1.2rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
                    {askResponse.message}
                  </p>
                )
              ) : null}
            </div>
          </section>

          <section className="rounded-[1.55rem] border border-white/70 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Supporting distributions
            </p>
            <div className="mt-4 grid gap-3">
              <DistributionRow title="Role distribution" data={health.roleDistribution} />
              <DistributionRow title="User status" data={health.statusDistribution} />
              <DistributionRow title="Login methods" data={health.loginMethodDistribution} />
            </div>
          </section>
        </section>
      </div>
    </section>
  );
}

function buildTrendData(charts: AdminAnalyticsChartBundle): TrendPoint[] {
  return charts.bookingsByDay.map((bookingPoint, index) => {
    const ticketPoint = charts.ticketsByDay[index];
    return {
      id: bookingPoint.id,
      label: bookingPoint.label,
      bookings: bookingPoint.value,
      tickets: ticketPoint?.value ?? 0,
      href: bookingPoint.href,
    };
  });
}

function buildIntensityData(points: AnalyticsSeriesPoint[]): IntensityPoint[] {
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  return points.map((point) => ({
    ...point,
    intensity: point.value / maxValue,
  }));
}

function buildShareSlices(points: AnalyticsSeriesPoint[]): ShareSlice[] {
  return points.map((point) => ({
    id: point.id,
    label: point.label,
    value: point.value,
    href: point.href,
  }));
}

function getNamedValue(items: AnalyticsNamedValue[], id: string) {
  return items.find((item) => item.id === id);
}

function HealthStatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "rose";
}) {
  return (
    <div
      className={`rounded-[1.2rem] border px-4 py-4 ${
        tone === "emerald"
          ? "border-emerald-200 bg-emerald-50"
          : "border-rose-200 bg-rose-50"
      }`}
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function MiniHealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[1rem] border border-slate-200 bg-white/80 px-4 py-3">
      <span className="text-sm text-slate-700">{label}</span>
      <span className="text-sm font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function InsightColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <p key={item} className="text-sm leading-7 text-slate-700">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function DistributionRow({
  title,
  data,
}: {
  title: string;
  data: AnalyticsNamedValue[];
}) {
  return (
    <section className="rounded-[1rem] border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {data.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            {item.label}: {item.value}
          </Link>
        ))}
      </div>
    </section>
  );
}
