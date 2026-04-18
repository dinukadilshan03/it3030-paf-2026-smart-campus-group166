import {
  getAwaitingFirstResponseCount,
  getFirstResponseTimerState,
  getResolutionTimerState,
  getSlaRiskTicketCount,
  getUnassignedTicketCount,
} from "@/lib/tickets/shared";
import type { TicketCategorySummary, TicketPriority, TicketStatus, TicketSummary } from "@/lib/tickets/types";
import type { CurrentUser } from "@/types/auth";

const DAY_MS = 24 * 60 * 60 * 1000;

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
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
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
      return "Track backlog, assignment coverage, SLA pressure, and the categories creating the most operational load across campus.";
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
      insights.push(`${slaRiskCount} ticket(s) are already at SLA risk and should be reviewed first.`);
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
    <div className="rounded-[1.5rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      <div className={`h-1.5 w-16 rounded-full ${accent}`} />
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
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
    <div className="rounded-[1.7rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
          {total} total
        </span>
      </div>

      <div className="mt-6 flex h-4 overflow-hidden rounded-full bg-slate-100">
        {series.map((item) => (
          <div
            key={item.key}
            className={item.tone}
            style={{ width: total === 0 ? "0%" : `${Math.max(8, (item.value / total) * 100)}%` }}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {series.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3"
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
    <div className="rounded-[1.7rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.label} className="space-y-2">
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
}: {
  points: Array<{ key: number; label: string; created: number; resolved: number }>;
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
    <div className="rounded-[1.7rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Six-week movement</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Compare newly reported tickets against tickets resolved over the last six weekly cycles.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-slate-400" />
            Created
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            Resolved
          </span>
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
                      className="w-full rounded-full bg-slate-400"
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
                      className="w-full rounded-full bg-emerald-500"
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
    <div className="rounded-[1.7rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
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
            <div key={item.label} className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 p-4">
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
    <div className="rounded-[1.7rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(226,232,240,0.35),rgba(255,255,255,0.95))] p-6 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-sm leading-6 text-slate-700"
          >
            {item}
          </div>
        ))}
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
  unassignedCount: number,
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
          label: "At SLA risk",
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
  const role = currentUser.role ?? "STUDENT";
  const nowMs = Date.now();
  const totalTickets = tickets.length;
  const awaitingResponse = getAwaitingFirstResponseCount(tickets);
  const unassignedCount = getUnassignedTicketCount(tickets);
  const slaRiskCount = getSlaRiskTicketCount(tickets, nowMs);
  const firstResponseRiskCount = tickets.filter(
    (ticket) => getFirstResponseTimerState(ticket, nowMs).tone === "danger",
  ).length;
  const resolutionRiskCount = tickets.filter(
    (ticket) => getResolutionTimerState(ticket, nowMs).tone === "danger",
  ).length;
  const categoriesInUseCount = new Set(tickets.map((ticket) => ticket.ticketCategoryId)).size;
  const oldestOpenTicketDays = getOldestOpenTicketDays(tickets, nowMs);
  const avgFirstResponseHours = getAverageDurationHours(tickets, (ticket) => ticket.firstRespondedAt);
  const avgResolutionHours = getAverageDurationHours(tickets, (ticket) => ticket.resolvedAt);
  const weeklySeries = buildWeeklySeries(tickets);
  const totalStaffReviews = tickets.reduce((sum, ticket) => sum + ticket.staffReviewCount, 0);
  const totalAdminReviews = tickets.reduce((sum, ticket) => sum + ticket.adminReviewCount, 0);
  const totalReconsiderationRequests = tickets.reduce(
    (sum, ticket) => sum + ticket.reconsiderationRequestCount,
    0,
  );

  const statusSeries = (Object.keys(STATUS_META) as TicketStatus[]).map((status) => ({
    key: status,
    label: STATUS_META[status].label,
    value: tickets.filter((ticket) => ticket.status === status).length,
    tone: STATUS_META[status].tone,
    softTone: STATUS_META[status].softTone,
    textTone: STATUS_META[status].textTone,
  }));

  const priorityCounts = toCountMap(tickets.map((ticket) => ticket.priority));
  const prioritySeries = (Object.keys(PRIORITY_META) as TicketPriority[]).map((priority) => ({
    key: priority,
    label: PRIORITY_META[priority].label,
    value: priorityCounts[priority] ?? 0,
    tone: PRIORITY_META[priority].tone,
    softTone: PRIORITY_META[priority].softTone,
    textTone: PRIORITY_META[priority].textTone,
  }));

  const categoryCounts = toCountMap(
    tickets.map((ticket) => ticket.ticketCategoryName || "Uncategorized"),
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
    tickets,
    awaitingResponse,
    slaRiskCount,
    unassignedCount,
  );
  const topCategory = categorySeries[0]?.label ?? null;
  const insights = buildInsights({
    role,
    totalTickets,
    awaitingResponse,
    slaRiskCount,
    unassignedCount,
    topCategory,
    oldestOpenTicketDays,
    avgFirstResponseHours,
    avgResolutionHours,
  });

  const headlineMetrics =
    role === "ADMIN"
      ? [
          {
            label: "Tickets in scope",
            value: totalTickets,
            detail: "Every ticket currently returned by your active role scope and filters.",
            accent: "bg-slate-900",
          },
          {
            label: "Unassigned",
            value: unassignedCount,
            detail: "Tickets still waiting for staff ownership before operational work begins.",
            accent: "bg-amber-500",
          },
          {
            label: "At SLA risk",
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
              label: "Tickets in scope",
              value: totalTickets,
              detail: "Your assigned tickets plus the issues you have reported yourself.",
              accent: "bg-slate-900",
            },
            {
              label: "Awaiting response",
              value: awaitingResponse,
              detail: "Tickets still lacking an initial operational update.",
              accent: "bg-sky-500",
            },
            {
              label: "At SLA risk",
              value: slaRiskCount,
              detail: "Tickets that need immediate attention to avoid breach pressure.",
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
              label: "Reported tickets",
              value: totalTickets,
              detail: "Every ticket you have reported in the current support workspace.",
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
    <section className="space-y-6 rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-8 shadow-[0_20px_65px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
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
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {getRoleAnalyticsDescription(role)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/90 px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Response pressure
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              {firstResponseRiskCount}
            </p>
            <p className="mt-2 text-sm text-slate-600">Tickets breaching or threatening first response timing.</p>
          </div>
          <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/90 px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Resolution pressure
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              {resolutionRiskCount}
            </p>
            <p className="mt-2 text-sm text-slate-600">Tickets breaching or threatening overall resolution timing.</p>
          </div>
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
        <WeeklyTrendChart points={weeklySeries} />
        <div className="space-y-4">
          <SegmentedDistribution
            title="Status distribution"
            subtitle="A quick view of how the current ticket scope is spread across the full workflow."
            series={statusSeries}
          />
          <SegmentedDistribution
            title="Priority mix"
            subtitle="Useful for spotting whether the workspace is leaning toward urgent or routine maintenance work."
            series={prioritySeries}
          />
        </div>
      </div>

      <ReviewOversightPanel
        totalTickets={totalTickets}
        totalStaffReviews={totalStaffReviews}
        totalAdminReviews={totalAdminReviews}
        totalReconsiderationRequests={totalReconsiderationRequests}
      />

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
    </section>
  );
}
