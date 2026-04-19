"use client";

import { useState } from "react";

import {
  getAwaitingFirstResponseCount,
  getFirstResponseTimerState,
  getResolutionTimerState,
  getSlaRiskTicketCount,
  getUnassignedTicketCount,
  isArchivedTicket,
  isOldTicket,
  parseTicketDateValue,
} from "@/lib/tickets/shared";
import type { TicketCategorySummary, TicketPriority, TicketStatus, TicketSummary } from "@/lib/tickets/types";
import type { CurrentUser } from "@/types/auth";

const DAY_MS = 24 * 60 * 60 * 1000;
type AnalyticsFocus = "pressure" | "movement" | "oversight";
type TrendMode = "both" | "created" | "resolved";

const STATUS_META: Record<
  TicketStatus,
  { label: string; tone: string; softTone: string; textTone: string }
> = {
  OPEN: {
    label: "Open",
    tone: "bg-sky-500",
    softTone: "bg-sky-100",
    textTone: "text-sky-700",
  },
  IN_PROGRESS: {
    label: "In progress",
    tone: "bg-amber-500",
    softTone: "bg-amber-100",
    textTone: "text-amber-700",
  },
  RESOLVED: {
    label: "Resolved",
    tone: "bg-emerald-500",
    softTone: "bg-emerald-100",
    textTone: "text-emerald-700",
  },
  CLOSED: {
    label: "Closed",
    tone: "bg-slate-500",
    softTone: "bg-slate-100",
    textTone: "text-slate-700",
  },
  REJECTED: {
    label: "Rejected",
    tone: "bg-rose-500",
    softTone: "bg-rose-100",
    textTone: "text-rose-700",
  },
};

const PRIORITY_META: Record<
  TicketPriority,
  { label: string; tone: string; softTone: string; textTone: string }
> = {
  LOW: {
    label: "Low",
    tone: "bg-slate-400",
    softTone: "bg-slate-100",
    textTone: "text-slate-700",
  },
  MEDIUM: {
    label: "Medium",
    tone: "bg-sky-400",
    softTone: "bg-sky-100",
    textTone: "text-sky-700",
  },
  HIGH: {
    label: "High",
    tone: "bg-amber-400",
    softTone: "bg-amber-100",
    textTone: "text-amber-700",
  },
  URGENT: {
    label: "Urgent",
    tone: "bg-rose-500",
    softTone: "bg-rose-100",
    textTone: "text-rose-700",
  },
};

function toCountMap<T extends string>(keys: T[]) {
  return keys.reduce<Record<T, number>>((accumulator, key) => {
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {} as Record<T, number>);
}

function getTopEntries(items: Record<string, number>, limit = 5) {
  return Object.entries(items)
    .filter(([, value]) => value > 0)
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit);
}

function formatPercentage(value: number, total: number) {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function getBarWidth(value: number, max: number) {
  if (max <= 0) return "8%";
  return `${Math.max(8, Math.round((value / max) * 100))}%`;
}

function parseDateMs(value: string | null | undefined) {
  return parseTicketDateValue(value);
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const dayIndex = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - dayIndex);
  next.setHours(0, 0, 0, 0);
  return next;
}

function buildWeeklySeries(tickets: TicketSummary[]) {
  const currentWeek = startOfWeek(new Date());
  const weeks = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() - (5 - index) * 7);
    return {
      key: date.getTime(),
      label: new Intl.DateTimeFormat("en-LK", { month: "short", day: "numeric" }).format(date),
      created: 0,
      resolved: 0,
    };
  });

  const lookup = new Map(weeks.map((week) => [week.key, week]));

  tickets.forEach((ticket) => {
    const createdAtMs = parseDateMs(ticket.createdAt);
    if (createdAtMs != null) {
      const createdWeekKey = startOfWeek(new Date(createdAtMs)).getTime();
      const week = lookup.get(createdWeekKey);
      if (week) {
        week.created += 1;
      }
    }

    const resolvedAtMs = parseDateMs(ticket.resolvedAt);
    if (resolvedAtMs != null) {
      const resolvedWeekKey = startOfWeek(new Date(resolvedAtMs)).getTime();
      const week = lookup.get(resolvedWeekKey);
      if (week) {
        week.resolved += 1;
      }
    }
  });

  return weeks;
}

function getAverageDurationHours(
  tickets: TicketSummary[],
  endSelector: (ticket: TicketSummary) => string | null,
) {
  const values = tickets
    .map((ticket) => {
      const createdAtMs = parseDateMs(ticket.createdAt);
      const endAtMs = parseDateMs(endSelector(ticket));
      if (createdAtMs == null || endAtMs == null || endAtMs < createdAtMs) {
        return null;
      }
      return (endAtMs - createdAtMs) / (1000 * 60 * 60);
    })
    .filter((value): value is number => value != null);

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatDuration(hours: number | null) {
  if (hours == null) {
    return "Not enough data";
  }
  if (hours >= 72) {
    return `${Math.round(hours / 24)} days`;
  }
  if (hours >= 1) {
    return `${Math.round(hours)} hrs`;
  }
  return `${Math.max(1, Math.round(hours * 60))} mins`;
}

function formatDays(days: number) {
  if (days <= 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function getOldestOpenTicketDays(tickets: TicketSummary[], nowMs: number) {
  const ages = tickets
    .filter((ticket) => ticket.status === "OPEN" || ticket.status === "IN_PROGRESS")
    .map((ticket) => {
      const createdAtMs = parseDateMs(ticket.createdAt);
      if (createdAtMs == null) {
        return null;
      }
      return Math.max(0, Math.round((nowMs - createdAtMs) / DAY_MS));
    })
    .filter((value): value is number => value != null);

  return ages.length ? Math.max(...ages) : 0;
}

function getRoleAnalyticsDescription(role: CurrentUser["role"]) {
  switch (role) {
    case "ADMIN":
      return "Track backlog, assignment coverage, service level agreement pressure, and the categories creating the most operational load across campus.";
    case "STAFF":
      return "See where your assigned workload is growing, which priorities need attention, and how quickly tickets are moving from report to fix.";
    case "STUDENT":
      return "Understand how your reported issues are progressing, where delays are happening, and which issue types you report most often.";
    default:
      return "Ticket analytics for the current workspace.";
  }
}

function buildInsights({
  role,
  totalTickets,
  awaitingResponse,
  slaRiskCount,
  unassignedCount,
  topCategory,
  oldestOpenTicketDays,
  avgFirstResponseHours,
  avgResolutionHours,
}: {
  role: NonNullable<CurrentUser["role"]>;
  totalTickets: number;
  awaitingResponse: number;
  slaRiskCount: number;
  unassignedCount: number;
  topCategory: string | null;
  oldestOpenTicketDays: number;
  avgFirstResponseHours: number | null;
  avgResolutionHours: number | null;
}) {
  if (totalTickets === 0) {
    return [
      "No ticket data is in scope yet, so analytics will populate as soon as this workspace has reported issues.",
    ];
  }

  const insights: string[] = [];

  if (role === "ADMIN") {
    if (unassignedCount > 0) {
      insights.push(`${unassignedCount} ticket(s) still need assignment before work can begin.`);
    }
    if (slaRiskCount > 0) {
      insights.push(`${slaRiskCount} ticket(s) are already at service level agreement risk and should be reviewed first.`);
    }
    if (topCategory) {
      insights.push(`${topCategory} is currently the busiest reporting category in this workspace.`);
    }
  } else if (role === "STAFF") {
    if (awaitingResponse > 0) {
      insights.push(`${awaitingResponse} ticket(s) are still waiting for a first response update.`);
    }
    if (oldestOpenTicketDays > 0) {
      insights.push(`Your oldest active ticket has been open for ${formatDays(oldestOpenTicketDays)}.`);
    }
    if (avgResolutionHours != null) {
      insights.push(`Resolved tickets are averaging ${formatDuration(avgResolutionHours)} from report to fix.`);
    }
  } else {
    if (awaitingResponse > 0) {
      insights.push(`${awaitingResponse} of your ticket(s) are still waiting for the first support response.`);
    }
    if (avgFirstResponseHours != null) {
      insights.push(`Your tickets are averaging ${formatDuration(avgFirstResponseHours)} to first response.`);
    }
    if (topCategory) {
      insights.push(`You report ${topCategory.toLowerCase()} issues most often in this workspace.`);
    }
  }

  if (insights.length === 0 && avgResolutionHours != null) {
    insights.push(`Average resolution time is currently ${formatDuration(avgResolutionHours)}.`);
  }

  return insights.slice(0, 4);
}

function AnalyticsFocusButton({
  label,
  title,
  value,
  detail,
  active,
  onClick,
}: {
  label: string;
  title: string;
  value: string | number;
  detail: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.45rem] border p-4 text-left transition ${
        active
          ? "border-sky-200 bg-[linear-gradient(135deg,rgba(224,242,254,0.92),rgba(255,255,255,0.98),rgba(238,242,255,0.94))] shadow-[0_18px_42px_rgba(59,130,246,0.12)]"
          : "border-white/80 bg-white/85 shadow-[0_14px_34px_rgba(15,23,42,0.05)] hover:border-sky-100 hover:bg-white"
      }`}
      aria-pressed={active}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-base font-semibold text-slate-950">{title}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
            active ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-700"
          }`}
        >
          {active ? "Active" : "Open"}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </button>
  );
}

function MetricCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string | number;
  detail: string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      <div className={`absolute inset-x-0 top-0 h-1.5 ${accent}`} />
      <div className={`pointer-events-none absolute right-2 top-2 h-20 w-20 rounded-full opacity-10 blur-2xl ${accent}`} />
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-[2.1rem] font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function SegmentedDistribution({
  title,
  subtitle,
  series,
}: {
  title: string;
  subtitle: string;
  series: Array<{
    key: string;
    label: string;
    value: number;
    tone: string;
    softTone: string;
    textTone: string;
  }>;
}) {
  const total = series.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-[1.7rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
          {total} total
        </span>
      </div>

      <div className="mt-6 flex h-5 overflow-hidden rounded-full bg-slate-100/90 p-1">
        {series.map((item) => (
          <div
            key={item.key}
            className={`rounded-full ${item.tone}`}
            style={{ width: total === 0 ? "0%" : `${Math.max(8, (item.value / total) * 100)}%` }}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {series.map((item) => (
          <div
            key={item.key}
            className={`rounded-2xl border border-slate-200/80 px-4 py-3 ${item.softTone}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${item.tone}`} />
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>
              <span className={`text-sm font-semibold ${item.textTone}`}>{item.value}</span>
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
              {formatPercentage(item.value, total)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBarList({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: Array<{ label: string; value: number; tone: string; softTone: string }>;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="rounded-[1.7rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.label} className="space-y-2 rounded-[1.2rem] border border-slate-200/70 bg-white/80 p-4">
            <div className="flex items-center justify-between gap-4 text-sm text-slate-700">
              <span>{item.label}</span>
              <span className="font-semibold text-slate-950">{item.value}</span>
            </div>
            <div className={`h-3 overflow-hidden rounded-full ${item.softTone}`}>
              <div
                className={`h-full rounded-full ${item.tone}`}
                style={{ width: getBarWidth(item.value, maxValue) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyTrendChart({
  points,
  trendMode,
  onTrendModeChange,
}: {
  points: Array<{ key: number; label: string; created: number; resolved: number }>;
  trendMode: TrendMode;
  onTrendModeChange: (nextMode: TrendMode) => void;
}) {
  const maxValue = Math.max(...points.flatMap((point) => [point.created, point.resolved]), 1);
  const guideValues = [maxValue, Math.max(1, Math.ceil(maxValue / 2)), 0];

  function getHeight(value: number) {
    if (value <= 0) {
      return "0.4rem";
    }
    return `${Math.max(10, Math.round((value / maxValue) * 100))}%`;
  }

  return (
    <div className="rounded-[1.7rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,246,255,0.92))] p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Six-week movement</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Compare newly reported tickets against tickets resolved over the last six weekly cycles.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <span className="inline-flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${trendMode === "resolved" ? "bg-slate-300" : "bg-sky-500"}`} />
              Created
            </span>
            <span className="inline-flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${trendMode === "created" ? "bg-emerald-200" : "bg-emerald-500"}`} />
              Resolved
            </span>
          </div>
          <div className="flex rounded-full border border-slate-200 bg-white/85 p-1 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            {(["both", "created", "resolved"] as TrendMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onTrendModeChange(mode)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  trendMode === mode
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-[32px_minmax(0,1fr)] gap-3">
        <div className="flex h-64 flex-col justify-between pb-10 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {guideValues.map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>

        <div className="grid grid-cols-6 gap-3">
          {points.map((point) => (
            <div key={point.key} className="space-y-3">
              <div className="relative h-64 rounded-[1.35rem] border border-slate-200/80 bg-slate-50/80 px-3 pb-4 pt-4">
                <div className="pointer-events-none absolute inset-x-3 top-4 bottom-4 flex flex-col justify-between">
                  {guideValues.map((value) => (
                    <div
                      key={`${point.key}-${value}`}
                      className="border-t border-dashed border-slate-200"
                    />
                  ))}
                </div>

                <div className="relative z-10 flex h-full items-end justify-center gap-3">
                  <div className="flex h-full w-full max-w-10 flex-col items-center justify-end gap-2">
                    <div className="text-center text-sm font-semibold text-slate-600">
                      {point.created}
                    </div>
                    <div
                      className={`w-full rounded-full ${
                        trendMode === "resolved"
                          ? "bg-slate-300"
                          : "bg-[linear-gradient(180deg,rgba(59,130,246,0.96),rgba(99,102,241,0.92))]"
                      }`}
                      style={{ height: getHeight(point.created) }}
                    />
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      C
                    </div>
                  </div>

                  <div className="flex h-full w-full max-w-10 flex-col items-center justify-end gap-2">
                    <div className="text-center text-sm font-semibold text-emerald-700">
                      {point.resolved}
                    </div>
                    <div
                      className={`w-full rounded-full ${
                        trendMode === "created"
                          ? "bg-emerald-200"
                          : "bg-[linear-gradient(180deg,rgba(16,185,129,0.96),rgba(45,212,191,0.92))]"
                      }`}
                      style={{ height: getHeight(point.resolved) }}
                    />
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      R
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1rem] bg-slate-50/80 px-2 py-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Week Of
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{point.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewOversightPanel({
  totalTickets,
  totalStaffReviews,
  totalAdminReviews,
  totalReconsiderationRequests,
}: {
  totalTickets: number;
  totalStaffReviews: number;
  totalAdminReviews: number;
  totalReconsiderationRequests: number;
}) {
  const combinedReviews = totalStaffReviews + totalAdminReviews;
  const avgReviewsPerTicket =
    totalTickets <= 0 ? "0.0" : (combinedReviews / totalTickets).toFixed(1);
  const maxValue = Math.max(totalStaffReviews, totalAdminReviews, totalReconsiderationRequests, 1);
  const items = [
    {
      label: "Staff review actions",
      value: totalStaffReviews,
      tone: "bg-emerald-500",
      softTone: "bg-emerald-100",
    },
    {
      label: "Admin review actions",
      value: totalAdminReviews,
      tone: "bg-slate-800",
      softTone: "bg-slate-100",
    },
    {
      label: "Reconsideration requests",
      value: totalReconsiderationRequests,
      tone: "bg-rose-500",
      softTone: "bg-rose-100",
    },
  ];

  return (
    <div className="rounded-[1.7rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Review oversight</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Track how often staff and admins actively handled tickets, plus how many rejected items
            were sent back for another review.
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
          {avgReviewsPerTicket} actions per ticket
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Staff review actions
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {totalStaffReviews}
            </p>
          </div>
          <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Admin review actions
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {totalAdminReviews}
            </p>
          </div>
          <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Reconsideration requests
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {totalReconsiderationRequests}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.label} className="rounded-[1.2rem] border border-slate-200 bg-white/84 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                <p className="text-sm font-semibold text-slate-950">{item.value}</p>
              </div>
              <div className={`mt-3 h-3 overflow-hidden rounded-full ${item.softTone}`}>
                <div
                  className={`h-full rounded-full ${item.tone}`}
                  style={{ width: getBarWidth(item.value, maxValue) }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InsightList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-[1.7rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(224,242,254,0.48),rgba(255,255,255,0.96),rgba(238,242,255,0.92))] p-6 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-sm leading-6 text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminTicketReviewPanel({
  tickets,
  nowMs,
}: {
  tickets: TicketSummary[];
  nowMs: number;
}) {
  const reporterCounts = toCountMap(tickets.map((ticket) => ticket.reporterDisplayName));
  const createdByUsers = getTopEntries(reporterCounts, 6).map(([label, value], index) => ({
    label,
    value,
    tone:
      index % 3 === 0 ? "bg-slate-800" : index % 3 === 1 ? "bg-sky-500" : "bg-emerald-500",
    softTone:
      index % 3 === 0 ? "bg-slate-100" : index % 3 === 1 ? "bg-sky-100" : "bg-emerald-100",
  }));
  const rejectedTickets = tickets.filter((ticket) => ticket.status === "REJECTED");
  const rejectedTicketPreview = rejectedTickets
    .sort((left, right) => (parseDateMs(right.updatedAt) ?? 0) - (parseDateMs(left.updatedAt) ?? 0))
    .slice(0, 6);
  const newRejectedTickets = rejectedTickets.filter((ticket) => !isOldTicket(ticket, nowMs)).length;
  const oldRejectedTickets = rejectedTickets.filter((ticket) => isOldTicket(ticket, nowMs)).length;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <HorizontalBarList
        title="Created tickets by users"
        subtitle="See which reporters are generating the most ticket volume inside the current admin history."
        items={
          createdByUsers.length > 0
            ? createdByUsers
            : [{ label: "No user-created tickets yet", value: 0, tone: "bg-slate-300", softTone: "bg-slate-100" }]
        }
      />

      <div className="rounded-[1.7rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,241,242,0.92))] p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Rejected ticket review</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review the rejected queue alongside the age split for rejected tickets only.
            </p>
          </div>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
            {rejectedTickets.length} currently rejected
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.2rem] border border-slate-200 bg-white/84 p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              New rejected
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {newRejectedTickets}
            </p>
          </div>
          <div className="rounded-[1.2rem] border border-slate-200 bg-white/84 p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Old rejected
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {oldRejectedTickets}
            </p>
          </div>
          <div className="rounded-[1.2rem] border border-slate-200 bg-white/84 p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Rejected tickets
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {rejectedTickets.length}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {rejectedTicketPreview.length === 0 ? (
            <div className="rounded-[1.2rem] border border-dashed border-slate-300 bg-white/84 px-4 py-5 text-sm leading-7 text-slate-600">
              No tickets are currently rejected in this admin view.
            </div>
          ) : (
            rejectedTicketPreview.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-[1.2rem] border border-slate-200 bg-white/84 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">
                      {ticket.ticketNumber}
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-950">{ticket.title}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Reporter: {ticket.reporterDisplayName}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                    Updated {formatDays(Math.max(0, Math.round((nowMs - (parseDateMs(ticket.updatedAt) ?? nowMs)) / DAY_MS)))}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getRoleSpotlightData(
  role: NonNullable<CurrentUser["role"]>,
  currentUserId: number | null,
  tickets: TicketSummary[],
  awaitingResponse: number,
  slaRiskCount: number,
) {
  if (role === "ADMIN") {
    const assignmentCounts = toCountMap(
      tickets.map((ticket) => ticket.assignedStaffDisplayName || "Unassigned"),
    );
    const items = getTopEntries(assignmentCounts, 6).map(([label, value]) => ({
      label,
      value,
      tone: label === "Unassigned" ? "bg-amber-500" : "bg-slate-800",
      softTone: label === "Unassigned" ? "bg-amber-100" : "bg-slate-100",
    }));

    return {
      title: "Assignment coverage",
      subtitle: "See who is carrying the most ticket ownership and which items still have no assignee.",
      items,
    };
  }

  if (role === "STAFF") {
    const assignedToYou = tickets.filter((ticket) => ticket.assignedStaffUserId === currentUserId).length;
    const reportedByYou = tickets.filter((ticket) => ticket.reporterUserId === currentUserId).length;
    return {
      title: "Your support mix",
      subtitle: "Track how much of your ticket scope is active handling versus issues you reported yourself.",
      items: [
        {
          label: "Assigned to you",
          value: assignedToYou,
          tone: "bg-slate-800",
          softTone: "bg-slate-100",
        },
        {
          label: "Reported by you",
          value: reportedByYou,
          tone: "bg-sky-500",
          softTone: "bg-sky-100",
        },
        {
          label: "Awaiting response",
          value: awaitingResponse,
          tone: "bg-amber-500",
          softTone: "bg-amber-100",
        },
        {
          label: "Service level agreement risk",
          value: slaRiskCount,
          tone: "bg-rose-500",
          softTone: "bg-rose-100",
        },
      ],
    };
  }

  return {
    title: "Support journey",
    subtitle: "See where your reported issues are waiting and how many have already moved to completion.",
    items: [
      {
        label: "Awaiting first response",
        value: awaitingResponse,
        tone: "bg-sky-500",
        softTone: "bg-sky-100",
      },
      {
        label: "In active work",
        value: tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
        tone: "bg-amber-500",
        softTone: "bg-amber-100",
      },
      {
        label: "Resolved or closed",
        value: tickets.filter((ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED").length,
        tone: "bg-emerald-500",
        softTone: "bg-emerald-100",
      },
      {
        label: "Rejected",
        value: tickets.filter((ticket) => ticket.status === "REJECTED").length,
        tone: "bg-rose-500",
        softTone: "bg-rose-100",
      },
    ],
  };
}

export function TicketAnalyticsPanel({
  tickets,
  currentUser,
  categories,
}: {
  tickets: TicketSummary[];
  currentUser: CurrentUser;
  categories: TicketCategorySummary[];
}) {
  const [focus, setFocus] = useState<AnalyticsFocus>("pressure");
  const [trendMode, setTrendMode] = useState<TrendMode>("both");
  const [nowMs] = useState(() => Date.now());
  const role = currentUser.role ?? "STUDENT";
  const liveScopeTickets = tickets.filter((ticket) => !isArchivedTicket(ticket));
  const archivedClosedCount = tickets.length - liveScopeTickets.length;
  const totalTickets = liveScopeTickets.length;
  const totalTicketHistory = tickets.length;
  const awaitingResponse = getAwaitingFirstResponseCount(liveScopeTickets);
  const unassignedCount = getUnassignedTicketCount(liveScopeTickets);
  const slaRiskCount = getSlaRiskTicketCount(liveScopeTickets, nowMs);
  const firstResponseRiskCount = liveScopeTickets.filter(
    (ticket) => getFirstResponseTimerState(ticket, nowMs).tone === "danger",
  ).length;
  const resolutionRiskCount = liveScopeTickets.filter(
    (ticket) => getResolutionTimerState(ticket, nowMs).tone === "danger",
  ).length;
  const categoriesInUseCount = new Set(liveScopeTickets.map((ticket) => ticket.ticketCategoryId)).size;
  const oldestOpenTicketDays = getOldestOpenTicketDays(liveScopeTickets, nowMs);
  const avgFirstResponseHours = getAverageDurationHours(tickets, (ticket) => ticket.firstRespondedAt);
  const avgResolutionHours = getAverageDurationHours(tickets, (ticket) => ticket.resolvedAt);
  const weeklySeries = buildWeeklySeries(tickets);
  const totalStaffReviews = tickets.reduce((sum, ticket) => sum + ticket.staffReviewCount, 0);
  const totalAdminReviews = tickets.reduce((sum, ticket) => sum + ticket.adminReviewCount, 0);
  const totalReconsiderationRequests = tickets.reduce(
    (sum, ticket) => sum + ticket.reconsiderationRequestCount,
    0,
  );
  const resolvedOrClosedCount = tickets.filter(
    (ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED",
  ).length;
  const activeWorkCount = liveScopeTickets.filter(
    (ticket) => ticket.status === "OPEN" || ticket.status === "IN_PROGRESS",
  ).length;
  const completionRate = formatPercentage(resolvedOrClosedCount, totalTicketHistory);
  const weeklyCreatedTotal = weeklySeries.reduce((sum, point) => sum + point.created, 0);
  const weeklyResolvedTotal = weeklySeries.reduce((sum, point) => sum + point.resolved, 0);
  const combinedReviews = totalStaffReviews + totalAdminReviews;

  const statusSeries = (Object.keys(STATUS_META) as TicketStatus[]).map((status) => ({
    key: status,
    label: STATUS_META[status].label,
    value: liveScopeTickets.filter((ticket) => ticket.status === status).length,
    tone: STATUS_META[status].tone,
    softTone: STATUS_META[status].softTone,
    textTone: STATUS_META[status].textTone,
  }));

  const priorityCounts = toCountMap(liveScopeTickets.map((ticket) => ticket.priority));
  const prioritySeries = (Object.keys(PRIORITY_META) as TicketPriority[]).map((priority) => ({
    key: priority,
    label: PRIORITY_META[priority].label,
    value: priorityCounts[priority] ?? 0,
    tone: PRIORITY_META[priority].tone,
    softTone: PRIORITY_META[priority].softTone,
    textTone: PRIORITY_META[priority].textTone,
  }));

  const categoryCounts = toCountMap(
    liveScopeTickets.map((ticket) => ticket.ticketCategoryName || "Uncategorized"),
  );
  const categorySeries = getTopEntries(categoryCounts, 6).map(([label, value], index) => ({
    label,
    value,
    tone:
      index % 3 === 0 ? "bg-slate-800" : index % 3 === 1 ? "bg-sky-500" : "bg-emerald-500",
    softTone:
      index % 3 === 0 ? "bg-slate-100" : index % 3 === 1 ? "bg-sky-100" : "bg-emerald-100",
  }));

  const spotlight = getRoleSpotlightData(
    role,
    currentUser.id,
    liveScopeTickets,
    awaitingResponse,
    slaRiskCount,
  );
  const topCategory = categorySeries[0]?.label ?? null;
  const insights = buildInsights({
    role,
    totalTickets: totalTicketHistory,
    awaitingResponse,
    slaRiskCount,
    unassignedCount,
    topCategory,
    oldestOpenTicketDays,
    avgFirstResponseHours,
    avgResolutionHours,
  });
  const focusCards = [
    {
      id: "pressure" as const,
      label: "Pressure",
      title: "Timing pressure",
      value: slaRiskCount,
      detail: `${firstResponseRiskCount} first response risk and ${resolutionRiskCount} resolution risk.`,
      summary:
        "See where the service level agreement clock is putting the most pressure on the current workspace.",
      statLabel: "Tickets needing timing attention",
      stats: [
        { label: "Awaiting first response", value: awaitingResponse },
        { label: "First response risk", value: firstResponseRiskCount },
        { label: "Resolution risk", value: resolutionRiskCount },
      ],
      surface:
        "border-rose-200 bg-[linear-gradient(135deg,rgba(255,241,242,0.96),rgba(255,255,255,0.98),rgba(255,247,237,0.92))]",
      badge: "bg-rose-100 text-rose-800",
      accent: "bg-[linear-gradient(90deg,rgba(244,63,94,0.94),rgba(251,113,133,0.78))]",
    },
    {
      id: "movement" as const,
      label: "Movement",
      title: "Flow through the queue",
      value: completionRate,
      detail: `${weeklyCreatedTotal} created and ${weeklyResolvedTotal} resolved across the last six weekly cycles.`,
      summary:
        "Use this view to judge whether incoming ticket volume is being cleared fast enough over time.",
      statLabel: "Current completion rate",
      stats: [
        { label: "Active work", value: activeWorkCount },
        { label: "Resolved or closed", value: resolvedOrClosedCount },
        { label: "Oldest active ticket", value: formatDays(oldestOpenTicketDays) },
      ],
      surface:
        "border-sky-200 bg-[linear-gradient(135deg,rgba(224,242,254,0.96),rgba(255,255,255,0.98),rgba(238,242,255,0.92))]",
      badge: "bg-sky-100 text-sky-800",
      accent: "bg-[linear-gradient(90deg,rgba(14,165,233,0.94),rgba(99,102,241,0.78))]",
    },
    {
      id: "oversight" as const,
      label: "Oversight",
      title: "Handling and review activity",
      value: combinedReviews,
      detail: `${totalStaffReviews} staff reviews, ${totalAdminReviews} admin reviews, and ${totalReconsiderationRequests} reconsideration requests.`,
      summary:
        "This lens surfaces how much human handling is happening around assignment, review, and rejected-ticket follow-up.",
      statLabel: "Review actions recorded",
      stats: [
        { label: "Unassigned", value: unassignedCount },
        { label: "Admin reviews", value: totalAdminReviews },
        { label: "Reconsiderations", value: totalReconsiderationRequests },
      ],
      surface:
        "border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(255,255,255,0.98),rgba(236,254,255,0.92))]",
      badge: "bg-emerald-100 text-emerald-800",
      accent: "bg-[linear-gradient(90deg,rgba(16,185,129,0.94),rgba(45,212,191,0.78))]",
    },
  ];
  const activeFocus = focusCards.find((item) => item.id === focus) ?? focusCards[0];

  const headlineMetrics =
    role === "ADMIN"
      ? [
          {
            label: "Tickets in scope",
            value: totalTickets,
            detail: "Active tickets currently returned by your role scope. Closed archived tickets are excluded.",
            accent: "bg-slate-900",
          },
          {
            label: "Unassigned",
            value: unassignedCount,
            detail: "Tickets still waiting for staff ownership before operational work begins.",
            accent: "bg-amber-500",
          },
          {
            label: "Service level agreement risk",
            value: slaRiskCount,
            detail: "Tickets with first-response or resolution timing already in danger.",
            accent: "bg-rose-500",
          },
          {
            label: "Category coverage",
            value: `${categoriesInUseCount}/${categories.length || 0}`,
            detail: "How many configured ticket categories are active in the current backlog.",
            accent: "bg-sky-500",
          },
        ]
      : role === "STAFF"
        ? [
            {
              label: "Active tickets in scope",
              value: totalTickets,
              detail: "Your assigned tickets plus the issues you have reported yourself, excluding archived closed work.",
              accent: "bg-slate-900",
            },
            {
            label: "Awaiting response",
            value: awaitingResponse,
            detail: "Tickets still lacking an initial operational update.",
            accent: "bg-sky-500",
          },
          {
            label: "Service level agreement risk",
            value: slaRiskCount,
            detail: "Tickets that need immediate attention to avoid service level agreement pressure.",
            accent: "bg-rose-500",
          },
            {
              label: "Oldest active ticket",
              value: formatDays(oldestOpenTicketDays),
              detail: "How long the longest open or in-progress item has been waiting.",
              accent: "bg-amber-500",
            },
          ]
        : [
            {
              label: "Active reported tickets",
              value: totalTickets,
              detail: "Tickets you have reported that are still in the active analytics scope.",
              accent: "bg-slate-900",
            },
            {
              label: "Awaiting first response",
              value: awaitingResponse,
              detail: "Reported issues still waiting for the first support update.",
              accent: "bg-sky-500",
            },
            {
              label: "Average first response",
              value: formatDuration(avgFirstResponseHours),
              detail: "Typical time between ticket creation and the first support response.",
              accent: "bg-emerald-500",
            },
            {
              label: "Average resolution",
              value: formatDuration(avgResolutionHours),
              detail: "Typical time from ticket creation to staff resolution.",
              accent: "bg-amber-500",
            },
          ];

  return (
    <section className="relative space-y-6 overflow-hidden rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.1),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(45,212,191,0.12),transparent_24%),radial-gradient(circle_at_70%_100%,rgba(99,102,241,0.1),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-8 shadow-[0_20px_65px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.35),transparent_28%,rgba(224,242,254,0.12)_56%,rgba(238,242,255,0.14))]" />
      <div className="pointer-events-none absolute -left-12 top-12 h-40 w-40 rounded-full bg-sky-300/12 blur-3xl" />
      <div className="pointer-events-none absolute right-8 top-0 h-36 w-36 rounded-full bg-teal-300/10 blur-3xl" />

      <div className="relative space-y-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
          <div className="rounded-[1.85rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,255,255,0.76),rgba(239,246,255,0.88))] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Analytics section
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              {role === "ADMIN"
                ? "Ticket operations analytics"
                : role === "STAFF"
                  ? "Support workload analytics"
                  : "My ticket analytics"}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              {getRoleAnalyticsDescription(role)}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.25rem] border border-white/90 bg-white/82 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Tickets in scope
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {totalTickets}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/90 bg-white/82 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Active work
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {activeWorkCount}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/90 bg-white/82 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Archived closed
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {archivedClosedCount}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-1">
            {focusCards.map((card) => (
              <AnalyticsFocusButton
                key={card.id}
                label={card.label}
                title={card.title}
                value={card.value}
                detail={card.detail}
                active={focus === card.id}
                onClick={() => setFocus(card.id)}
              />
            ))}
          </div>
        </div>

        <div className={`rounded-[1.85rem] border p-6 shadow-[0_20px_55px_rgba(15,23,42,0.06)] ${activeFocus.surface}`}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${activeFocus.badge}`}>
                {activeFocus.label} focus
              </span>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                {activeFocus.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{activeFocus.summary}</p>
            </div>

            <div className="min-w-[15rem] rounded-[1.35rem] border border-white/90 bg-white/82 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
              <div className={`h-2 w-20 rounded-full ${activeFocus.accent}`} />
              <p className="mt-4 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {activeFocus.statLabel}
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                {activeFocus.value}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{activeFocus.detail}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {activeFocus.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.25rem] border border-white/90 bg-white/78 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]"
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {headlineMetrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              detail={metric.detail}
              accent={metric.accent}
            />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <WeeklyTrendChart
            points={weeklySeries}
            trendMode={trendMode}
            onTrendModeChange={setTrendMode}
          />
          <div className="space-y-4">
            <SegmentedDistribution
              title="Status distribution"
              subtitle="A quick view of how the current active ticket scope is spread across the live workflow."
              series={statusSeries}
            />
            <SegmentedDistribution
              title="Priority mix"
              subtitle="Useful for spotting whether the active workspace is leaning toward urgent or routine maintenance work."
              series={prioritySeries}
            />
          </div>
        </div>

        <ReviewOversightPanel
          totalTickets={totalTicketHistory}
          totalStaffReviews={totalStaffReviews}
          totalAdminReviews={totalAdminReviews}
          totalReconsiderationRequests={totalReconsiderationRequests}
        />

        {role === "ADMIN" ? (
          <AdminTicketReviewPanel tickets={tickets} nowMs={nowMs} />
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.95fr)]">
          <HorizontalBarList
            title="Category hotspots"
            subtitle="The categories driving the most ticket activity in the current workspace."
            items={
              categorySeries.length > 0
                ? categorySeries
                : [{ label: "No category data yet", value: 0, tone: "bg-slate-300", softTone: "bg-slate-100" }]
            }
          />
          <HorizontalBarList
            title={spotlight.title}
            subtitle={spotlight.subtitle}
            items={
              spotlight.items.length > 0
                ? spotlight.items
                : [{ label: "No distribution available", value: 0, tone: "bg-slate-300", softTone: "bg-slate-100" }]
            }
          />
          <InsightList title="What stands out" items={insights} />
        </div>
      </div>
    </section>
  );
}
