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
  AnalyticsRange,
} from "@/lib/admin-analytics/types";
import { HorizontalBarList, TimelineBars } from "./ChartPrimitives";

type AdminAnalyticsWorkspaceProps = {
  initialRange: AnalyticsRange;
  initialOverview: AdminAnalyticsOverview;
  initialCharts: AdminAnalyticsChartBundle;
  initialHealth: AdminAnalyticsHealth;
  initialInsights: AdminAnalyticsInsightResponse;
};

const RANGE_OPTIONS: AnalyticsRange[] = ["7D", "30D", "90D"];

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
              notification posture, and Gemini-assisted interpretation grounded in backend metrics.
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
            <p className="text-sm font-medium text-slate-600">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {metric.value}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-600">{metric.changeLabel}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="space-y-6">
          <TimelineBars
            title="Bookings by day"
            description="Scheduled demand over the selected window."
            data={charts.bookingsByDay}
            href="/bookings"
          />
          <TimelineBars
            title="Tickets by day"
            description="New issue reports entering the system each day."
            data={charts.ticketsByDay}
            href="/tickets"
          />
          <HorizontalBarList
            title="Peak booking hours"
            description="Most frequently requested start times."
            data={charts.peakBookingHours}
            href="/bookings"
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <HorizontalBarList
              title="Top resources"
              description="Most-booked spaces and assets."
              data={charts.topResources}
              href="/resources"
            />
            <HorizontalBarList
              title="Top locations"
              description="Buildings or areas drawing the most booking demand."
              data={charts.topLocations}
              href="/resources"
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <HorizontalBarList
              title="Ticket categories"
              description="Operational issue mix for the selected range."
              data={charts.ticketCategories}
              href="/tickets"
            />
            <HorizontalBarList
              title="Notification types"
              description="Platform activity split by notification source."
              data={charts.notificationTypes}
              href="/notifications"
            />
          </div>
          <HorizontalBarList
            title="Auth event mix"
            description="Observed authentication and credential lifecycle events."
            data={charts.authEventsByType}
            href="/analytics"
          />
        </section>

        <section className="space-y-6">
          <section className="rounded-[1.55rem] border border-white/70 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  AI insights
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Gemini Flash-Lite
                </h2>
              </div>
            </div>

            {insights.available ? (
              <div className="mt-5 space-y-5">
                <p className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-900">
                  {insights.summary}
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Highlights
                    </p>
                    <div className="mt-3 space-y-3">
                      {insights.highlights.map((item) => (
                        <p key={item.text} className="text-sm leading-7 text-slate-700">
                          {item.text}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Anomalies
                    </p>
                    <div className="mt-3 space-y-3">
                      {insights.anomalies.length > 0 ? (
                        insights.anomalies.map((item) => (
                          <p key={item.text} className="text-sm leading-7 text-slate-700">
                            {item.text}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm leading-7 text-slate-600">
                          No exceptional pattern was highlighted in this run.
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Recommendations
                    </p>
                    <div className="mt-3 space-y-3">
                      {insights.recommendations.map((item) => (
                        <p key={item.text} className="text-sm leading-7 text-slate-700">
                          {item.text}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-5 rounded-[1.2rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
                {insights.message}
              </p>
            )}
          </section>

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
                {isAsking ? "Asking Gemini..." : "Ask analytics"}
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
              Auth and notification health
            </p>
            <div className="mt-5 grid gap-3">
              {[...health.authHealth, ...health.notificationHealth].map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-950">{item.value}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[1.55rem] border border-white/70 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Health flags
            </p>
            <div className="mt-4 space-y-3">
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
          </section>

          <section className="rounded-[1.55rem] border border-white/70 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
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
        </section>
      </div>
    </section>
  );
}
