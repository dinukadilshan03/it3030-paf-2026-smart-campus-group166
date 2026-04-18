"use client";

import { useEffect, useState } from "react";

import {
  canCurrentUserDeleteTicket,
  canCurrentUserEditTicket,
  canCurrentUserUpdateStatus,
  formatDateTime,
  getFirstResponseTimerState,
  getResolutionTimerState,
  getSlaTargetLabel,
  getTicketErrorMessage,
  getTicketProgressLabel,
  toTicketTitleCase,
} from "@/lib/tickets/shared";
import type {
  CreateTicketCommentRequest,
  TicketBundle,
  TicketAttachmentUpload,
  TicketDetail,
  UpdateTicketCommentRequest,
} from "@/lib/tickets/types";
import type { CurrentUser } from "@/types/auth";
import { TicketAttachmentPanel } from "@/components/tickets/TicketAttachmentPanel";
import { TicketComments } from "@/components/tickets/TicketComments";
import { TicketPriorityBadge } from "@/components/tickets/TicketPriorityBadge";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";

type TicketDetailPanelProps = {
  currentUser: CurrentUser;
  ticketBundle: TicketBundle | null;
  detailLoading?: boolean;
  busy?: boolean;
  onOpenEdit: () => void;
  onOpenAssignment: () => void;
  onOpenStatus: () => void;
  onDeleteTicket: () => Promise<void>;
  onRequestReconsideration: (note: string) => Promise<void>;
  onCreateComment: (payload: CreateTicketCommentRequest) => Promise<void>;
  onUpdateComment: (commentId: number, payload: UpdateTicketCommentRequest) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
  onCreateAttachment: (payload: TicketAttachmentUpload) => Promise<void>;
  onDeleteAttachment: (attachmentId: number) => Promise<void>;
};

const WORKFLOW_STEPS = [
  {
    status: "OPEN",
    label: "Open",
    description: "Submitted by the student and waiting for operational action.",
  },
  {
    status: "IN_PROGRESS",
    label: "In progress",
    description: "Assigned staff are actively working on the issue.",
  },
  {
    status: "RESOLVED",
    label: "Resolved",
    description: "Staff captured the fix and handed the ticket back for closure.",
  },
  {
    status: "CLOSED",
    label: "Closed",
    description: "Admin review is complete and the ticket is fully closed out.",
  },
] as const;

type DetailFactTone = "teal" | "sky" | "indigo" | "amber" | "slate";
type WorkflowVisualState = "completed" | "current" | "pending";
type TimerVisualTone = "neutral" | "success" | "danger";

const DETAIL_FACT_TONE_CLASS: Record<DetailFactTone, string> = {
  teal: "border-teal-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,253,250,0.92))]",
  sky: "border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,249,255,0.92))]",
  indigo:
    "border-indigo-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,242,255,0.92))]",
  amber:
    "border-amber-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,251,235,0.9))]",
  slate:
    "border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))]",
};

type DetailFactCardProps = {
  label: string;
  value: string;
  tone?: DetailFactTone;
  featured?: boolean;
  empty?: boolean;
};

function DetailFactCard({
  label,
  value,
  tone = "slate",
  featured = false,
  empty = false,
}: DetailFactCardProps) {
  return (
    <div
      className={`rounded-[1.2rem] border p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)] ${
        featured ? "sm:col-span-2" : ""
      } ${DETAIL_FACT_TONE_CLASS[tone]}`}
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-3 text-sm leading-7 ${
          empty ? "font-medium italic text-slate-400" : "font-semibold text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

const WORKFLOW_VISUAL_THEME: Record<
  WorkflowVisualState,
  {
    card: string;
    circle: string;
    line: string;
    badge: string;
    body: string;
  }
> = {
  completed: {
    card: "border-emerald-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(236,253,245,0.94))]",
    circle:
      "border-emerald-300 bg-emerald-500 text-white shadow-[0_12px_28px_rgba(16,185,129,0.28)]",
    line: "bg-[linear-gradient(90deg,rgba(16,185,129,0.9),rgba(45,212,191,0.72))]",
    badge: "bg-emerald-100 text-emerald-800",
    body: "text-emerald-950",
  },
  current: {
    card: "border-sky-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,246,255,0.96))]",
    circle:
      "border-sky-300 bg-[linear-gradient(135deg,rgba(14,165,233,1),rgba(59,130,246,0.96),rgba(99,102,241,0.96))] text-white shadow-[0_12px_28px_rgba(59,130,246,0.26)]",
    line: "bg-[linear-gradient(90deg,rgba(59,130,246,0.8),rgba(191,219,254,0.55))]",
    badge: "bg-sky-100 text-sky-800",
    body: "text-sky-950",
  },
  pending: {
    card: "border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))]",
    circle: "border-slate-200 bg-white text-slate-500",
    line: "bg-slate-200",
    badge: "bg-slate-200 text-slate-700",
    body: "text-slate-950",
  },
};

const TIMER_VISUAL_THEME: Record<
  TimerVisualTone,
  {
    card: string;
    badge: string;
    ringColor: string;
    ringTrack: string;
    bar: string;
    text: string;
  }
> = {
  neutral: {
    card: "border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))]",
    badge: "bg-slate-100 text-slate-700",
    ringColor: "#64748b",
    ringTrack: "rgba(148,163,184,0.2)",
    bar: "bg-[linear-gradient(90deg,rgba(100,116,139,0.9),rgba(148,163,184,0.72))]",
    text: "text-slate-700",
  },
  success: {
    card: "border-emerald-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(236,253,245,0.94))]",
    badge: "bg-emerald-100 text-emerald-800",
    ringColor: "#10b981",
    ringTrack: "rgba(52,211,153,0.18)",
    bar: "bg-[linear-gradient(90deg,rgba(16,185,129,0.92),rgba(45,212,191,0.78))]",
    text: "text-emerald-950",
  },
  danger: {
    card: "border-rose-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,241,242,0.96))]",
    badge: "bg-rose-100 text-rose-800",
    ringColor: "#f43f5e",
    ringTrack: "rgba(251,113,133,0.2)",
    bar: "bg-[linear-gradient(90deg,rgba(244,63,94,0.92),rgba(251,113,133,0.78))]",
    text: "text-rose-950",
  },
};

const SLA_TARGET_MINUTES: Record<
  TicketDetail["priority"],
  { firstResponse: number; resolution: number }
> = {
  LOW: { firstResponse: 8 * 60, resolution: 72 * 60 },
  MEDIUM: { firstResponse: 4 * 60, resolution: 48 * 60 },
  HIGH: { firstResponse: 2 * 60, resolution: 24 * 60 },
  URGENT: { firstResponse: 60, resolution: 8 * 60 },
};

type TimerVisualData = {
  usedPercent: number;
  ringPercent: number;
  tone: TimerVisualTone;
  statusLabel: string;
  checkpointLabel: string;
  checkpointValue: string;
  summaryLabel: string;
};

type ServiceTimerVisualCardProps = {
  title: string;
  stateLabel: string;
  targetLabel: string;
  visual: TimerVisualData;
};

function parseTicketDateMs(value: string | null | undefined) {
  if (!value) return null;

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function getWorkflowStepState(
  detail: TicketDetail,
  index: number,
  workflowStepIndex: number,
): WorkflowVisualState {
  if (detail.status === "REJECTED") {
    return index === 0 ? "current" : "pending";
  }

  if (index < workflowStepIndex) return "completed";
  if (index === workflowStepIndex) return "current";
  return "pending";
}

function getWorkflowStepTimestamp(detail: TicketDetail, status: (typeof WORKFLOW_STEPS)[number]["status"]) {
  switch (status) {
    case "OPEN":
      return detail.createdAt;
    case "IN_PROGRESS":
      return detail.firstRespondedAt;
    case "RESOLVED":
      return detail.resolvedAt;
    case "CLOSED":
      return detail.closedAt;
  }
}

function getServiceTimerVisualData(
  detail: TicketDetail,
  timer: "firstResponse" | "resolution",
  stateLabel: string,
  tone: TimerVisualTone,
  nowMs: number,
): TimerVisualData {
  const createdAtMs = parseTicketDateMs(detail.createdAt);
  const targetMinutes = SLA_TARGET_MINUTES[detail.priority][timer];
  const targetMs = targetMinutes * 60 * 1000;
  const resolvedOrRespondedAtMs = parseTicketDateMs(
    timer === "firstResponse" ? detail.firstRespondedAt : detail.resolvedAt,
  );
  const rejectedAtMs =
    timer === "resolution" && detail.status === "REJECTED"
      ? parseTicketDateMs(detail.rejectedAt)
      : null;

  if (createdAtMs == null) {
    return {
      usedPercent: 0,
      ringPercent: 8,
      tone,
      statusLabel: tone === "danger" ? "Over target" : tone === "success" ? "Within target" : "In progress",
      checkpointLabel:
        timer === "firstResponse" ? "First response recorded" : "Resolved at",
      checkpointValue:
        timer === "firstResponse"
          ? formatDateTime(detail.firstRespondedAt)
          : formatDateTime(detail.resolvedAt),
      summaryLabel: "Waiting for valid timestamps",
    };
  }

  const measuredAtMs = resolvedOrRespondedAtMs ?? rejectedAtMs ?? nowMs;
  const elapsedMs = Math.max(0, measuredAtMs - createdAtMs);
  const ratio = targetMs > 0 ? elapsedMs / targetMs : 0;
  const usedPercent = Math.min(Math.round(ratio * 100), 100);
  const ringPercent = Math.max(Math.min(usedPercent, 100), 8);
  const overrunPercent = Math.max(0, Math.round((ratio - 1) * 100));
  const summaryLabel =
    overrunPercent > 0
      ? `${overrunPercent}% over the service level agreement target`
      : `${Math.max(0, 100 - usedPercent)}% of the service level agreement window still available`;

  return {
    usedPercent,
    ringPercent,
    tone,
    statusLabel:
      tone === "danger"
        ? "Over target"
        : tone === "success"
          ? "Within target"
          : "In progress",
    checkpointLabel:
      timer === "firstResponse"
        ? "First response recorded"
        : detail.status === "REJECTED" && !detail.resolvedAt
          ? "Stopped at"
          : "Resolved at",
    checkpointValue:
      timer === "firstResponse"
        ? formatDateTime(detail.firstRespondedAt)
        : detail.status === "REJECTED" && !detail.resolvedAt
          ? formatDateTime(detail.rejectedAt)
          : formatDateTime(detail.resolvedAt),
    summaryLabel,
  };
}

function ServiceTimerVisualCard({
  title,
  stateLabel,
  targetLabel,
  visual,
}: ServiceTimerVisualCardProps) {
  const theme = TIMER_VISUAL_THEME[visual.tone];

  return (
    <div className={`rounded-[1.35rem] border p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] ${theme.card}`}>
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[8.5rem_minmax(0,1fr)] lg:items-center">
        <div className="flex items-center justify-center">
          <div
            className="relative h-28 w-28 rounded-full"
            style={{
              background: `conic-gradient(${theme.ringColor} ${visual.ringPercent * 3.6}deg, ${theme.ringTrack} ${visual.ringPercent * 3.6}deg 360deg)`,
            }}
          >
            <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <span className="text-center text-[0.54rem] font-semibold uppercase leading-[1.2] tracking-[0.14em] text-slate-500">
                Service level agreement
              </span>
              <span className={`mt-2 text-2xl font-semibold tracking-tight ${theme.text}`}>
                {visual.usedPercent}%
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">{title}</p>
              <p className={`mt-3 text-3xl font-semibold tracking-tight ${theme.text}`}>
                {stateLabel}
              </p>
            </div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${theme.badge}`}>
              {visual.statusLabel}
            </span>
          </div>

          <div className="mt-5 rounded-[1rem] border border-white/90 bg-white/76 p-4">
            <div className="relative h-3 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${theme.bar}`}
                style={{ width: `${visual.ringPercent}%` }}
              />
              <div className="absolute inset-y-[-3px] right-0 w-px bg-slate-400/60" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>Start</span>
              <span>Target {targetLabel}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1rem] border border-white/90 bg-white/72 px-4 py-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Checkpoint
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {visual.checkpointLabel}
              </p>
              <p className="mt-1 text-sm text-slate-600">{visual.checkpointValue}</p>
            </div>
            <div className="rounded-[1rem] border border-white/90 bg-white/72 px-4 py-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Quick read
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {visual.summaryLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TicketDetailPanel({
  currentUser,
  ticketBundle,
  detailLoading = false,
  busy = false,
  onOpenEdit,
  onOpenAssignment,
  onOpenStatus,
  onDeleteTicket,
  onRequestReconsideration,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  onCreateAttachment,
  onDeleteAttachment,
}: TicketDetailPanelProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reconsiderationNote, setReconsiderationNote] = useState("");
  const [reconsiderationError, setReconsiderationError] = useState<string | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  if (!ticketBundle) {
    return (
      <section className="rounded-[1.75rem] border border-white/70 bg-white/85 p-8 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Ticket details
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Select a ticket to inspect the workflow
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          The detail area shows incident context, assignment, process tracking, service timers,
          comments, and evidence images once you choose a ticket from the queue.
        </p>
      </section>
    );
  }

  const { detail, comments, attachments } = ticketBundle;

  const canAssign = currentUser.role === "ADMIN";
  const canEdit =
    currentUser.role != null &&
    currentUser.id != null &&
    canCurrentUserEditTicket(currentUser.role, currentUser.id, detail);
  const canDelete =
    currentUser.role != null &&
    currentUser.id != null &&
    canCurrentUserDeleteTicket(currentUser.role, currentUser.id, detail);
  const canUpdate =
    currentUser.role != null &&
    currentUser.id != null &&
    canCurrentUserUpdateStatus(currentUser.role, currentUser.id, detail);
  const firstResponseState = getFirstResponseTimerState(detail, nowMs);
  const resolutionState = getResolutionTimerState(detail, nowMs);
  const workflowStepIndex =
    detail.status === "REJECTED"
      ? 0
      : WORKFLOW_STEPS.findIndex((step) => step.status === detail.status);
  const canRequestReconsideration =
    currentUser.id != null &&
    currentUser.role != null &&
    currentUser.role !== "ADMIN" &&
    detail.status === "REJECTED" &&
    detail.reporterUserId === currentUser.id;
  const hasHeroActions = canEdit || canAssign || canUpdate || canDelete;
  const showRejectedHeroPanel = detail.status === "REJECTED";
  const latestComment = comments[0] ?? null;
  const issueContextFacts = [
    {
      label: "Category",
      value: detail.ticketCategoryName,
      tone: "teal" as const,
    },
    {
      label: "Resource",
      value: detail.resourceName
        ? detail.resourceCode
          ? `${detail.resourceName} (${detail.resourceCode})`
          : detail.resourceName
        : "No specific resource",
      tone: "sky" as const,
      featured: true,
      empty: !detail.resourceName,
    },
    {
      label: "Resource type",
      value: detail.resourceCategoryName || "Not provided",
      tone: "sky" as const,
      empty: !detail.resourceCategoryName,
    },
    {
      label: "Location",
      value: detail.locationName || "Not provided",
      tone: "indigo" as const,
      empty: !detail.locationName,
    },
    {
      label: "Building",
      value: detail.locationBuilding || "Not provided",
      tone: "slate" as const,
      empty: !detail.locationBuilding,
    },
    {
      label: "Floor",
      value: detail.locationFloor || "Not provided",
      tone: "slate" as const,
      empty: !detail.locationFloor,
    },
    {
      label: "Room",
      value: detail.locationRoomIdentifier || "Not provided",
      tone: "slate" as const,
      empty: !detail.locationRoomIdentifier,
    },
    {
      label: "Location notes",
      value: detail.locationDescription || "Not provided",
      tone: "amber" as const,
      featured: true,
      empty: !detail.locationDescription,
    },
    {
      label: "Created",
      value: formatDateTime(detail.createdAt),
      tone: "amber" as const,
    },
    {
      label: "Last updated",
      value: formatDateTime(detail.updatedAt),
      tone: "amber" as const,
    },
  ];
  const peopleFacts = [
    {
      label: "Reporter",
      value: detail.reporterDisplayName,
      tone: "teal" as const,
    },
    {
      label: "Assigned staff",
      value: detail.assignedStaffDisplayName ?? "Not assigned yet",
      tone: "sky" as const,
      empty: !detail.assignedStaffDisplayName,
    },
    {
      label: "Reporter email",
      value: detail.reporterEmail,
      tone: "indigo" as const,
      featured: true,
    },
    {
      label: "Preferred contact name",
      value: detail.preferredContactName || "Not provided",
      tone: "slate" as const,
      empty: !detail.preferredContactName,
    },
    {
      label: "Preferred contact email",
      value: detail.preferredContactEmail || "Not provided",
      tone: "slate" as const,
      empty: !detail.preferredContactEmail,
    },
    {
      label: "Preferred contact phone",
      value: detail.preferredContactPhone || "Not provided",
      tone: "slate" as const,
      empty: !detail.preferredContactPhone,
    },
  ];
  const normalizedWorkflowStepIndex = workflowStepIndex < 0 ? 0 : workflowStepIndex;
  const workflowCurrentLabel =
    detail.status === "REJECTED"
      ? "Admin rejection"
      : WORKFLOW_STEPS[normalizedWorkflowStepIndex]?.label ?? toTicketTitleCase(detail.status);
  const workflowStageNumber =
    detail.status === "REJECTED" ? 1 : normalizedWorkflowStepIndex + 1;
  const workflowStageLabel =
    detail.status === "REJECTED"
      ? "Exception path"
      : `Stage ${workflowStageNumber} of ${WORKFLOW_STEPS.length}`;
  const workflowProgressPercent =
    detail.status === "REJECTED"
      ? 22
      : Math.max(18, Math.round((workflowStageNumber / WORKFLOW_STEPS.length) * 100));
  const workflowProgressBarClass =
    detail.status === "REJECTED"
      ? "bg-[linear-gradient(90deg,rgba(244,63,94,0.94),rgba(251,113,133,0.78))]"
      : "bg-[linear-gradient(90deg,rgba(20,184,166,0.92),rgba(14,165,233,0.86),rgba(99,102,241,0.82))]";
  const firstResponseVisual = getServiceTimerVisualData(
    detail,
    "firstResponse",
    firstResponseState.label,
    firstResponseState.tone,
    nowMs,
  );
  const resolutionVisual = getServiceTimerVisualData(
    detail,
    "resolution",
    resolutionState.label,
    resolutionState.tone,
    nowMs,
  );
  const serviceHealthLabel =
    firstResponseState.tone === "danger" || resolutionState.tone === "danger"
      ? "Outside service level agreement"
      : firstResponseState.tone === "success" && resolutionState.tone === "success"
        ? "Within service level agreement"
        : "Tracking service level agreement";

  return (
    <section className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.9rem] border border-sky-100/80 bg-[radial-gradient(circle_at_0%_0%,rgba(45,212,191,0.16),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(125,211,252,0.16),transparent_28%),radial-gradient(circle_at_72%_100%,rgba(129,140,248,0.12),transparent_34%),linear-gradient(135deg,rgba(240,253,250,0.9),rgba(248,250,252,0.97)_42%,rgba(239,246,255,0.94)_72%,rgba(238,242,255,0.92))] p-8 shadow-[0_24px_70px_rgba(14,116,144,0.1)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(45,212,191,0.07),transparent_26%,rgba(59,130,246,0.05)_58%,rgba(99,102,241,0.08))]" />
        <div className="pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-full bg-cyan-300/14 blur-3xl" />
        <div className="pointer-events-none absolute right-24 top-0 h-36 w-36 rounded-full bg-sky-300/12 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-2 h-36 w-36 rounded-full bg-indigo-300/14 blur-3xl" />

        <div className="relative space-y-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <p className="inline-flex items-center rounded-full border border-sky-100 bg-white/85 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-sky-800 shadow-[0_10px_24px_rgba(14,116,144,0.08)]">
                {detail.ticketNumber}
              </p>
              <h2 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">
                {detail.title}
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                {detail.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="inline-flex items-center rounded-full border border-sky-100 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_rgba(14,116,144,0.08)]">
                  {getTicketProgressLabel(detail)}
                </span>
                <span className="inline-flex items-center rounded-full border border-white/80 bg-slate-900/[0.04] px-4 py-2 text-sm font-medium text-slate-700">
                  {detail.ticketCategoryName}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              <TicketStatusBadge status={detail.status} />
              <TicketPriorityBadge priority={detail.priority} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: "Raised", value: formatDateTime(detail.createdAt) },
              { label: "Updated", value: formatDateTime(detail.updatedAt) },
              { label: "Current step", value: toTicketTitleCase(detail.status) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.25rem] border border-white/80 bg-white/78 px-4 py-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {detailLoading ? (
            <p className="rounded-[1.1rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              Refreshing ticket details...
            </p>
          ) : null}

          {showRejectedHeroPanel ? (
            <div className="rounded-[1.35rem] border border-rose-200/90 bg-[linear-gradient(135deg,rgba(255,241,242,0.96),rgba(255,255,255,0.94),rgba(255,247,237,0.92))] p-5 shadow-[0_18px_40px_rgba(244,63,94,0.08)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">
                    Rejected ticket
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                    Rejected by admin review
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {detail.reconsiderationRequestedAt
                      ? "This ticket is rejected and already has a reconsideration request on file."
                      : "This ticket is currently rejected. Use the details below if you need to review the reason or ask for another check."}
                  </p>
                </div>

                <span className="inline-flex items-center rounded-full border border-rose-200 bg-white/90 px-4 py-2 text-sm font-semibold text-rose-700 shadow-[0_10px_24px_rgba(244,63,94,0.08)]">
                  Rejected on {formatDateTime(detail.rejectedAt)}
                </span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="rounded-[1.15rem] border border-white/90 bg-white/78 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-rose-500">
                    Rejection reason
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {detail.rejectionReason || "A rejection reason has not been recorded yet."}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-[1.15rem] border border-white/90 bg-white/78 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Reconsideration requests
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                      {detail.reconsiderationRequestCount}
                    </p>
                  </div>
                  {detail.reconsiderationReviewedAt ? (
                    <div className="rounded-[1.15rem] border border-white/90 bg-white/78 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Last reviewed
                      </p>
                      <p className="mt-3 text-sm font-semibold text-slate-900">
                        {formatDateTime(detail.reconsiderationReviewedAt)}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {detail.reconsiderationNote ? (
                <div className="mt-4 rounded-[1.15rem] border border-rose-200/80 bg-white/82 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-rose-500">
                    Latest reconsideration note
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{detail.reconsiderationNote}</p>
                  {detail.reconsiderationRequestedAt ? (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Sent {formatDateTime(detail.reconsiderationRequestedAt)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {canRequestReconsideration ? (
                <form
                  className="mt-4 rounded-[1.15rem] border border-rose-200/80 bg-white/82 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.04)]"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const nextNote = reconsiderationNote.trim();
                    if (!nextNote) {
                      setReconsiderationError("Explain why admin should review this rejection again.");
                      return;
                    }

                    setReconsiderationError(null);
                    try {
                      await onRequestReconsideration(nextNote);
                    } catch (error) {
                      setReconsiderationError(
                        getTicketErrorMessage(
                          error,
                          "Could not send the reconsideration request.",
                        ),
                      );
                    }
                  }}
                >
                  <p className="text-sm font-semibold text-slate-950">Ask admin to check again</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Add the missing context, explain what may have been misunderstood, or point out
                    why this ticket should be reviewed again.
                  </p>
                  <textarea
                    rows={4}
                    value={reconsiderationNote}
                    onChange={(event) => setReconsiderationNote(event.target.value)}
                    className="mt-4 min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-300"
                    placeholder="Example: this is not a duplicate because it affects a different lab and the issue is still active."
                  />
                  {reconsiderationError ? (
                    <p className="mt-2 text-xs font-semibold text-rose-600">{reconsiderationError}</p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {detail.reconsiderationRequestedAt ? "Update reconsideration note" : "Request reconsideration"}
                    </button>
                    {detail.reconsiderationRequestedAt ? (
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Last sent {formatDateTime(detail.reconsiderationRequestedAt)}
                      </span>
                    ) : null}
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}

          {hasHeroActions ? (
            <div className="rounded-[1.25rem] border border-white/80 bg-white/72 p-3 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
              <div className="flex flex-wrap gap-3">
                {canEdit ? (
                  <button
                    type="button"
                    onClick={onOpenEdit}
                    disabled={busy}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Edit ticket
                  </button>
                ) : null}
                {canAssign ? (
                  <button
                    type="button"
                    onClick={onOpenAssignment}
                    disabled={busy}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {detail.status === "REJECTED"
                      ? "Reopen and assign staff"
                      : "Assign or reassign staff"}
                  </button>
                ) : null}
                {canUpdate ? (
                  <button
                    type="button"
                    onClick={onOpenStatus}
                    disabled={busy}
                    className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(15,118,110,1),rgba(14,116,144,0.96),rgba(67,56,202,0.96))] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Update status
                  </button>
                ) : null}
                {canDelete ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const confirmationMessage =
                        currentUser.role === "ADMIN"
                          ? "Delete this open ticket from the queue?"
                          : "Withdraw this open ticket?";
                      if (!window.confirm(confirmationMessage)) {
                        return;
                      }
                      await onDeleteTicket();
                    }}
                    disabled={busy}
                    className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {currentUser.role === "ADMIN"
                      ? "Delete ticket"
                      : "Withdraw ticket"}
                  </button>
                ) : null}
              </div>
            </div>
          ) : !showRejectedHeroPanel ? (
            <div className="rounded-[1.25rem] border border-sky-100/90 bg-white/70 px-5 py-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-semibold text-slate-900">
                No direct actions available for this ticket
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {detail.status === "RESOLVED"
                  ? "This issue has already been resolved by staff and is now waiting for admin closure, so edit and withdraw actions are no longer available."
                  : detail.status === "CLOSED"
                    ? "This ticket is fully closed and kept here as a read-only record."
                    : "This ticket can still be tracked through comments, status updates, and workflow history, but direct edit or withdraw actions are not available in its current state."}
              </p>
            </div>
          ) : null}

          <div className="rounded-[1.25rem] border border-sky-100/90 bg-white/72 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold text-slate-950">
                  Updates and conversation
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Click the button to open the comment area, add an update, ask a question, or
                  review the latest replies and status notes for this ticket.
                </p>
                {latestComment ? (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Latest activity {formatDateTime(latestComment.createdAt)}
                  </p>
                ) : (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    No conversation yet. Be the first to add an update.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full border border-sky-100 bg-white/90 px-4 py-2 text-sm font-semibold text-sky-800 shadow-[0_10px_24px_rgba(14,116,144,0.08)]">
                  {comments.length} comment{comments.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  aria-expanded={commentsOpen}
                  onClick={() => setCommentsOpen((current) => !current)}
                  className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(15,118,110,1),rgba(14,116,144,0.96),rgba(67,56,202,0.96))] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105"
                >
                  {commentsOpen ? "Hide comments" : "Open comments and add update"}
                </button>
              </div>
            </div>
          </div>

          {commentsOpen ? (
            <TicketComments
              key={`comments-${detail.id}`}
              embedded
              currentUser={currentUser}
              ticket={detail}
              comments={comments}
              busy={busy}
              onSubmit={onCreateComment}
              onUpdate={onUpdateComment}
              onDelete={onDeleteComment}
            />
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="relative overflow-hidden rounded-[1.65rem] border border-teal-100/80 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,253,250,0.88))] p-6 shadow-[0_20px_55px_rgba(15,118,110,0.09)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(90deg,rgba(45,212,191,0.08),rgba(125,211,252,0.03),transparent)]" />
          <div className="relative">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Issue context
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Where the issue is happening
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                  Resource, location, and timing details collected for this ticket.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-teal-100 bg-white/90 px-4 py-2 text-sm font-semibold text-teal-800 shadow-[0_10px_24px_rgba(15,118,110,0.08)]">
                {detail.ticketCategoryName}
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {issueContextFacts.map((item) => (
                <DetailFactCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  tone={item.tone}
                  featured={item.featured}
                  empty={item.empty}
                />
              ))}
              <div className="sm:col-span-2">
                <TicketAttachmentPanel
                  key={`attachments-${detail.id}`}
                  embedded
                  currentUser={currentUser}
                  ticket={detail}
                  attachments={attachments}
                  busy={busy}
                  onCreate={onCreateAttachment}
                  onDelete={onDeleteAttachment}
                />
              </div>
            </div>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-[1.65rem] border border-sky-100/80 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,246,255,0.9))] p-6 shadow-[0_20px_55px_rgba(14,116,144,0.08)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(270deg,rgba(125,211,252,0.08),rgba(129,140,248,0.04),transparent)]" />
          <div className="relative">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  People and contact
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Who is involved
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                  Reporter, assignee, and preferred contact details for follow-up.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-sky-100 bg-white/90 px-4 py-2 text-sm font-semibold text-sky-800 shadow-[0_10px_24px_rgba(14,116,144,0.08)]">
                Reporter and support
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {peopleFacts.map((item) => (
                <DetailFactCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  tone={item.tone}
                  featured={item.featured}
                  empty={item.empty}
                />
              ))}
            </div>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-[1.65rem] border border-indigo-100/80 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_32%),radial-gradient(circle_at_90%_18%,rgba(96,165,250,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,242,255,0.92))] p-6 shadow-[0_20px_55px_rgba(59,130,246,0.09)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(90deg,rgba(45,212,191,0.08),rgba(125,211,252,0.05),transparent)]" />
          <div className="relative">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Process tracker
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Follow the ticket journey at a glance
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                  The flow below highlights what has been completed, what is active now, and what
                  still remains before the ticket can fully close.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-indigo-100 bg-white/90 px-4 py-2 text-sm font-semibold text-indigo-800 shadow-[0_10px_24px_rgba(99,102,241,0.08)]">
                  {workflowStageLabel}
                </span>
                <span className="inline-flex items-center rounded-full border border-sky-100 bg-white/90 px-4 py-2 text-sm font-semibold text-sky-800 shadow-[0_10px_24px_rgba(14,116,144,0.08)]">
                  {workflowCurrentLabel}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-[1.3rem] border border-white/90 bg-white/78 p-4 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                <span>Ticket opened</span>
                <span>{detail.status === "REJECTED" ? "Review branch" : "Closure ready"}</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200/80">
                <div
                  className={`h-full rounded-full ${workflowProgressBarClass}`}
                  style={{ width: `${workflowProgressPercent}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                <p>{getTicketProgressLabel(detail)}</p>
                <p className="font-semibold text-slate-900">
                  {workflowProgressPercent}% of the main flow covered
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {WORKFLOW_STEPS.map((step, index) => {
                const visualState = getWorkflowStepState(detail, index, workflowStepIndex);
                const visualTheme = WORKFLOW_VISUAL_THEME[visualState];
                const stepTimestamp = getWorkflowStepTimestamp(detail, step.status);
                const stepStatusLabel =
                  visualState === "current"
                    ? "Current"
                    : visualState === "completed"
                      ? "Done"
                      : "Pending";
                const stepTimestampLabel =
                  visualState === "pending"
                    ? "Expected next"
                    : visualState === "current"
                      ? "Active since"
                      : "Completed on";
                const stepTimestampValue =
                  stepTimestamp != null
                    ? formatDateTime(stepTimestamp)
                    : visualState === "pending"
                      ? "Not reached yet"
                      : "Waiting for a recorded time";

                return (
                  <div
                    key={step.status}
                    className={`rounded-[1.3rem] border p-4 shadow-[0_18px_36px_rgba(15,23,42,0.05)] ${visualTheme.card}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-[1.1rem] border text-base font-semibold ${visualTheme.circle}`}
                      >
                        {index + 1}
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${visualTheme.badge}`}
                      >
                        {stepStatusLabel}
                      </span>
                    </div>

                    <p className={`mt-4 text-lg font-semibold tracking-tight ${visualTheme.body}`}>
                      {step.label}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>

                    <div className="mt-4 rounded-[1rem] border border-white/90 bg-white/76 px-4 py-3">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {stepTimestampLabel}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {stepTimestampValue}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </article>

        <article className="relative overflow-hidden rounded-[1.65rem] border border-emerald-100/80 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(236,253,245,0.9))] p-6 shadow-[0_20px_55px_rgba(16,185,129,0.08)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(270deg,rgba(16,185,129,0.08),rgba(14,165,233,0.05),transparent)]" />
          <div className="relative">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Service timers
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Service level agreement performance
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                  Circular meters and progress bars show how much of each service level agreement
                  window was used before first response and final resolution.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-emerald-100 bg-white/90 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                  {toTicketTitleCase(detail.priority)} priority
                </span>
                <span className="inline-flex items-center rounded-full border border-sky-100 bg-white/90 px-4 py-2 text-sm font-semibold text-sky-800 shadow-[0_10px_24px_rgba(14,116,144,0.08)]">
                  {serviceHealthLabel}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <ServiceTimerVisualCard
                title="Time to first response"
                stateLabel={firstResponseState.label}
                targetLabel={getSlaTargetLabel(detail.priority, "firstResponse")}
                visual={firstResponseVisual}
              />
              <ServiceTimerVisualCard
                title="Time to resolution"
                stateLabel={resolutionState.label}
                targetLabel={getSlaTargetLabel(detail.priority, "resolution")}
                visual={resolutionVisual}
              />
            </div>
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-white/70 bg-white/85 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Review counters
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Staff review actions
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {detail.staffReviewCount}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Counted when staff picks up or resolves the ticket during handling.
              </p>
            </div>
            <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Admin review actions
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {detail.adminReviewCount}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Counted when admin assigns, closes, rejects, or reopens the ticket for review.
              </p>
            </div>
            <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Reconsideration requests
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {detail.reconsiderationRequestCount}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Reporter requests asking admin to review a rejection again.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-white/70 bg-white/85 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Assignment history
          </p>
          <div className="mt-5 space-y-4">
            {detail.assignmentHistory.length === 0 ? (
              <div className="rounded-[1.2rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-7 text-slate-600">
                No assignment events have been recorded yet.
              </div>
            ) : null}

            {detail.assignmentHistory.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-950">
                    {assignment.assignedToDisplayName}
                  </p>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                      assignment.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {assignment.isActive ? "Active" : "Closed"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Assigned by {assignment.assignedByDisplayName} on{" "}
                  {formatDateTime(assignment.assignedAt)}
                </p>
                {assignment.unassignedAt ? (
                  <p className="text-sm text-slate-600">
                    Reassignment closed on {formatDateTime(assignment.unassignedAt)}
                  </p>
                ) : null}
                {assignment.assignmentNote ? (
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {assignment.assignmentNote}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </article>

      </div>

    </section>
  );
}
