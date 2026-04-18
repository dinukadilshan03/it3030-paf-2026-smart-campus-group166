"use client";

import { useRef, useState } from "react";

import { AssignmentDialog } from "@/components/tickets/AssignmentDialog";
import { CreateTicketForm } from "@/components/tickets/CreateTicketForm";
import { EditTicketDialog } from "@/components/tickets/EditTicketDialog";
import { StatusUpdateDialog } from "@/components/tickets/StatusUpdateDialog";
import { TicketCategoryManager } from "@/components/tickets/TicketCategoryManager";
import { TicketDetailPanel } from "@/components/tickets/TicketDetailPanel";
import { TicketFilters } from "@/components/tickets/TicketFilters";
import { TicketList } from "@/components/tickets/TicketList";
import { TicketAnalyticsPanel } from "@/components/tickets/TicketAnalyticsPanel";
import { TicketReportsPanel } from "@/components/tickets/TicketReportsPanel";
import {
  createTicketAttachmentClient,
  createTicketCategoryClient,
  createTicketClient,
  createTicketCommentClient,
  deleteTicketClient,
  deleteTicketCommentClient,
  deleteTicketAttachmentClient,
  deleteTicketCategoryClient,
  getTicketBundleClient,
  listTicketCategoriesClient,
  requestTicketReconsiderationClient,
  listTicketsClient,
  updateTicketClient,
  updateTicketCommentClient,
  updateTicketAssignmentClient,
  updateTicketCategoryClient,
  updateTicketStatusClient,
} from "@/lib/tickets/client";
import {
  DEFAULT_TICKET_FILTERS,
  getAwaitingFirstResponseCount,
  getFirstResponseTimerState,
  getInProgressTicketCount,
  getOpenTicketCount,
  getResolutionTimerState,
  getResolvedTicketCount,
  getSlaRiskTicketCount,
  getTicketErrorMessage,
  getUnassignedTicketCount,
  resolveSelectedTicketId,
  TicketApiError,
} from "@/lib/tickets/shared";
import type {
  CreateTicketCommentRequest,
  CreateTicketSubmission,
  TicketBundle,
  TicketCategorySummary,
  TicketFilters as TicketFilterValues,
  TicketLocationOption,
  TicketReportRecord,
  TicketResourceOption,
  TicketSummary,
  UpdateTicketCommentRequest,
} from "@/lib/tickets/types";
import type { CurrentUser } from "@/types/auth";
import type { AdminUserSummary } from "@/lib/users/types";

type TicketWorkspacePageProps = {
  currentUser: CurrentUser;
  initialTickets: TicketSummary[];
  initialCategories: TicketCategorySummary[];
  initialLocations: TicketLocationOption[];
  initialResources: TicketResourceOption[];
  initialStaffUsers: AdminUserSummary[];
  initialReporterUsers: AdminUserSummary[];
  initialReports: TicketReportRecord[];
  initialSelectedBundle: TicketBundle | null;
};

type FeedbackState =
  | {
      tone: "success" | "error";
      message: string;
    }
  | null;

type TicketQuickView = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "FOCUS";
type SnapshotTone = "slate" | "sky" | "amber" | "emerald" | "rose";

function getWorkspaceHeading(role: CurrentUser["role"]) {
  switch (role) {
    case "ADMIN":
      return "Admin ticket operations";
    case "STAFF":
      return "Assigned staff workbench";
    case "STUDENT":
      return "Student ticket tracker";
    default:
      return "Ticket workspace";
  }
}

function getWorkspaceDescription(role: CurrentUser["role"]) {
  switch (role) {
    case "ADMIN":
      return "Review every campus issue report, assign the right staff owner, reject invalid requests when needed, close resolved work, and keep categories clean for reporting.";
    case "STAFF":
      return "Work the tickets assigned to you, report new campus issues when you spot them, document progress with comments or internal notes, and capture a proper resolution summary before admin closure.";
    case "STUDENT":
      return "Report faults against a room, lab, or equipment item, then follow assignment, comments, and service-level timing directly inside the ticket workflow.";
    default:
      return "Manage the maintenance and incident workflow.";
  }
}

function getFocusMetricDescription(role: NonNullable<CurrentUser["role"]>) {
  switch (role) {
    case "ADMIN":
      return "Open tickets that still need an owner before operational work can start.";
    case "STAFF":
      return "Tickets trending overdue on first response or overall resolution timing.";
    case "STUDENT":
      return "Tickets that are still waiting for the first operational response.";
  }
}

function getQuickViewLabel(quickView: TicketQuickView, focusMetricLabel: string): string {
  switch (quickView) {
    case "ALL":
      return "All in-scope tickets";
    case "OPEN":
      return "Open tickets";
    case "IN_PROGRESS":
      return "In-progress tickets";
    case "RESOLVED":
      return "Resolved tickets";
    case "FOCUS":
      return focusMetricLabel;
  }
}

function getQuickViewDescription(
  quickView: TicketQuickView,
  focusMetricLabel: string,
  role: NonNullable<CurrentUser["role"]>,
) {
  switch (quickView) {
    case "ALL":
      return "The queue below shows every ticket returned by the current search, category, priority, and status filters.";
    case "OPEN":
      return "The queue is narrowed to newly reported issues that still need action.";
    case "IN_PROGRESS":
      return "The queue is narrowed to tickets that staff are currently working through.";
    case "RESOLVED":
      return "The queue is narrowed to tickets that were fixed and are waiting for completion steps.";
    case "FOCUS":
      return `${focusMetricLabel} is active. ${getFocusMetricDescription(role)}`;
  }
}

function getSnapshotToneClass(tone: SnapshotTone, active: boolean) {
  const baseClass =
    "rounded-[1.4rem] border p-5 text-left transition shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur";

  if (active) {
    switch (tone) {
      case "slate":
        return `${baseClass} border-slate-900 bg-slate-950 text-white shadow-[0_18px_55px_rgba(15,23,42,0.2)]`;
      case "sky":
        return `${baseClass} border-sky-400 bg-sky-50 text-sky-950`;
      case "amber":
        return `${baseClass} border-amber-400 bg-amber-50 text-amber-950`;
      case "emerald":
        return `${baseClass} border-emerald-400 bg-emerald-50 text-emerald-950`;
      case "rose":
        return `${baseClass} border-rose-400 bg-rose-50 text-rose-950`;
    }
  }

  return `${baseClass} border-white/70 bg-white/85 text-slate-950 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white`;
}

function isFocusTicket(
  ticket: TicketSummary,
  role: NonNullable<CurrentUser["role"]>,
  nowMs: number,
) {
  switch (role) {
    case "ADMIN":
      return !ticket.assignedStaffUserId && !["CLOSED", "REJECTED"].includes(ticket.status);
    case "STAFF": {
      const firstResponseState = getFirstResponseTimerState(ticket, nowMs);
      const resolutionState = getResolutionTimerState(ticket, nowMs);
      return firstResponseState.tone === "danger" || resolutionState.tone === "danger";
    }
    case "STUDENT":
      return !ticket.firstRespondedAt && !["CLOSED", "REJECTED"].includes(ticket.status);
  }
}

function getTicketsForQuickView(
  tickets: TicketSummary[],
  quickView: TicketQuickView,
  role: NonNullable<CurrentUser["role"]>,
  nowMs: number,
) {
  switch (quickView) {
    case "ALL":
      return tickets;
    case "OPEN":
      return tickets.filter((ticket) => ticket.status === "OPEN");
    case "IN_PROGRESS":
      return tickets.filter((ticket) => ticket.status === "IN_PROGRESS");
    case "RESOLVED":
      return tickets.filter((ticket) => ticket.status === "RESOLVED");
    case "FOCUS":
      return tickets.filter((ticket) => isFocusTicket(ticket, role, nowMs));
  }
}

function scrollToSection(section: HTMLElement | null) {
  section?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function TicketWorkspacePage({
  currentUser,
  initialTickets,
  initialCategories,
  initialLocations,
  initialResources,
  initialStaffUsers,
  initialReporterUsers,
  initialReports,
  initialSelectedBundle,
}: TicketWorkspacePageProps) {
  const currentRole = currentUser.role ?? "STUDENT";
  const queueSectionRef = useRef<HTMLElement | null>(null);
  const detailSectionRef = useRef<HTMLElement | null>(null);
  const analyticsSectionRef = useRef<HTMLElement | null>(null);
  const reportsSectionRef = useRef<HTMLElement | null>(null);
  const [tickets, setTickets] = useState(initialTickets);
  const [categories, setCategories] = useState(initialCategories);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(
    initialSelectedBundle?.detail.id ?? initialTickets[0]?.id ?? null,
  );
  const [selectedBundle, setSelectedBundle] = useState<TicketBundle | null>(initialSelectedBundle);
  const [filters, setFilters] = useState<Required<TicketFilterValues>>({
    ...DEFAULT_TICKET_FILTERS,
  });
  const [draftFilters, setDraftFilters] = useState<Required<TicketFilterValues>>({
    ...DEFAULT_TICKET_FILTERS,
  });
  const [quickView, setQuickView] = useState<TicketQuickView>("ALL");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const nowMs = Date.now();

  const openCount = getOpenTicketCount(tickets);
  const inProgressCount = getInProgressTicketCount(tickets);
  const resolvedCount = getResolvedTicketCount(tickets);
  const unassignedCount = getUnassignedTicketCount(tickets);
  const awaitingFirstResponseCount = getAwaitingFirstResponseCount(tickets);
  const slaRiskCount = getSlaRiskTicketCount(tickets, nowMs);
  const focusMetricLabel =
    currentRole === "ADMIN"
      ? "Unassigned"
      : currentRole === "STAFF"
        ? "SLA at risk"
        : "Awaiting first response";
  const focusMetricValue =
    currentRole === "ADMIN"
      ? unassignedCount
      : currentRole === "STAFF"
        ? slaRiskCount
        : awaitingFirstResponseCount;
  const focusMetricTone: SnapshotTone =
    currentRole === "ADMIN" ? "amber" : currentRole === "STAFF" ? "rose" : "sky";
  const activeQuickViewLabel = getQuickViewLabel(quickView, focusMetricLabel);
  const visibleTickets = getTicketsForQuickView(tickets, quickView, currentRole, nowMs);
  const emptyStateMessage =
    tickets.length === 0
      ? "No tickets match the current role scope and server filters."
      : "No tickets match the selected snapshot card. Choose another card or clear the quick view.";

  async function syncWorkspace(
    nextFilters: Required<TicketFilterValues>,
    preferredTicketId: number | null,
  ) {
    const filtersToUse = { ...nextFilters };
    const nextTickets = await listTicketsClient(filtersToUse);
    const nextVisibleTickets = getTicketsForQuickView(
      nextTickets,
      quickView,
      currentRole,
      Date.now(),
    );
    const nextSelectedTicketId = resolveSelectedTicketId(
      nextVisibleTickets,
      preferredTicketId,
    );
    const nextBundle =
      nextSelectedTicketId == null ? null : await getTicketBundleClient(nextSelectedTicketId);

    setTickets(nextTickets);
    setSelectedTicketId(nextSelectedTicketId);
    setSelectedBundle(nextBundle);
    setFilters(filtersToUse);
    setDraftFilters(filtersToUse);
  }

  async function refreshSelectedBundle(ticketId = selectedTicketId) {
    if (ticketId == null) {
      setSelectedBundle(null);
      return;
    }

    const nextBundle = await getTicketBundleClient(ticketId);
    setSelectedBundle(nextBundle);
  }

  async function refreshCategories() {
    const nextCategories = await listTicketCategoriesClient();
    setCategories(nextCategories);
    return nextCategories;
  }

  async function applyQuickView(nextQuickView: TicketQuickView) {
    const resolvedQuickView =
      nextQuickView === quickView && nextQuickView !== "ALL" ? "ALL" : nextQuickView;
    const nextVisibleTickets = getTicketsForQuickView(
      tickets,
      resolvedQuickView,
      currentRole,
      Date.now(),
    );
    const nextSelectedTicketId = resolveSelectedTicketId(
      nextVisibleTickets,
      selectedTicketId,
    );

    setQuickView(resolvedQuickView);
    setSelectedTicketId(nextSelectedTicketId);
    setFeedback(null);

    if (nextSelectedTicketId == null) {
      setSelectedBundle(null);
      scrollToSection(queueSectionRef.current);
      return;
    }

    if (nextSelectedTicketId !== selectedTicketId) {
      setIsDetailLoading(true);
      try {
        setSelectedBundle(await getTicketBundleClient(nextSelectedTicketId));
      } catch (error) {
        setFeedback({
          tone: "error",
          message: getTicketErrorMessage(
            error,
            "Could not load the selected quick-view ticket.",
          ),
        });
      } finally {
        setIsDetailLoading(false);
      }
    }

    scrollToSection(queueSectionRef.current);
  }

  async function handleSelectTicket(ticketId: number) {
    setFeedback(null);
    setSelectedTicketId(ticketId);
    setIsDetailLoading(true);
    try {
      setSelectedBundle(await getTicketBundleClient(ticketId));
      scrollToSection(detailSectionRef.current);
    } catch (error) {
      setFeedback({
        tone: "error",
        message: getTicketErrorMessage(error, "Could not load the selected ticket."),
      });
    } finally {
      setIsDetailLoading(false);
    }
  }

  return (
    <>
      <section className="space-y-8">
        <section className="rounded-[1.9rem] border border-white/70 bg-white/85 p-8 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Ticket workflow
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                {getWorkspaceHeading(currentUser.role)}
              </h1>
              <p className="mt-4 text-base leading-8 text-slate-600">
                {getWorkspaceDescription(currentUser.role)}
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                Use the snapshot cards to move through the queue quickly, then jump straight into
                the queue or the selected ticket workspace below.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 xl:items-end">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setCreateDialogOpen(true)}
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Report issue
                </button>
                {currentRole === "ADMIN" ? (
                  <button
                    type="button"
                    onClick={() => setCategoryDialogOpen(true)}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Manage categories
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={isListLoading || isMutating}
                  onClick={async () => {
                    setFeedback(null);
                    setIsListLoading(true);
                    try {
                      await syncWorkspace(filters, selectedTicketId);
                    } catch (error) {
                      setFeedback({
                        tone: "error",
                        message: getTicketErrorMessage(
                          error,
                          "Could not refresh the ticket queue.",
                        ),
                      });
                    } finally {
                      setIsListLoading(false);
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Refresh queue
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => scrollToSection(queueSectionRef.current)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Jump to queue
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection(analyticsSectionRef.current)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Jump to analytics
                </button>
                <button
                  type="button"
                  disabled={!selectedBundle}
                  onClick={() => scrollToSection(detailSectionRef.current)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Jump to selected ticket
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection(reportsSectionRef.current)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Jump to reports
                </button>
                {quickView !== "ALL" ? (
                  <button
                    type="button"
                    onClick={() => applyQuickView("ALL")}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Clear quick view
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {feedback ? (
          <p
            className={`rounded-[1.3rem] border px-4 py-3 text-sm ${
              feedback.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {feedback.message}
          </p>
        ) : null}

        <section className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Queue shortcuts
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Click a card to focus the queue
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                These are quick queue controls, not the full analytics dashboard. Clicking a card
                changes only the queue view below, so you can narrow work fast without losing your
                search and filter setup.
              </p>
            </div>
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              Viewing: {activeQuickViewLabel}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              {
                id: "ALL" as const,
                label: "Tickets in scope",
                value: tickets.length,
                tone: "slate" as const,
                description: "Every ticket returned by the current queue filters.",
              },
              {
                id: "OPEN" as const,
                label: "Open",
                value: openCount,
                tone: "sky" as const,
                description: "Freshly reported incidents waiting for active handling.",
              },
              {
                id: "IN_PROGRESS" as const,
                label: "In progress",
                value: inProgressCount,
                tone: "amber" as const,
                description: "Issues with staff work already underway.",
              },
              {
                id: "RESOLVED" as const,
                label: "Resolved",
                value: resolvedCount,
                tone: "emerald" as const,
                description: "Tickets fixed by staff and ready for final closure steps.",
              },
              {
                id: "FOCUS" as const,
                label: focusMetricLabel,
                value: focusMetricValue,
                tone: focusMetricTone,
                description: getFocusMetricDescription(currentRole),
              },
            ].map((card) => {
              const isActive = quickView === card.id;

              return (
                <button
                  key={card.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => applyQuickView(card.id)}
                  className={getSnapshotToneClass(card.tone, isActive)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          isActive && card.tone === "slate" ? "text-white/80" : "text-slate-600"
                        }`}
                      >
                        {card.label}
                      </p>
                      <p className="mt-3 text-3xl font-semibold tracking-tight">{card.value}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                        isActive
                          ? card.tone === "slate"
                            ? "bg-white/15 text-white"
                            : "bg-white text-slate-900"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {isActive ? "Active" : "View"}
                    </span>
                  </div>
                  <p
                    className={`mt-4 text-sm leading-6 ${
                      isActive && card.tone === "slate" ? "text-white/80" : "text-slate-600"
                    }`}
                  >
                    {card.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
          <section ref={queueSectionRef} className="scroll-mt-28 space-y-5">
            <div className="px-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Queue and filters
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Browse the active queue
                </h2>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                  {visibleTickets.length} shown
                  {visibleTickets.length !== tickets.length ? ` / ${tickets.length}` : ""}
                </span>
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {getQuickViewDescription(quickView, focusMetricLabel, currentRole)}
              </p>
            </div>

            <TicketFilters
              value={draftFilters}
              categories={categories}
              busy={isListLoading || isMutating}
              onChange={setDraftFilters}
              onApply={async () => {
                setFeedback(null);
                setIsListLoading(true);
                try {
                  await syncWorkspace(draftFilters, selectedTicketId);
                } catch (error) {
                  setFeedback({
                    tone: "error",
                    message: getTicketErrorMessage(error, "Could not apply ticket filters."),
                  });
                } finally {
                  setIsListLoading(false);
                }
              }}
              onReset={async () => {
                const nextFilters = { ...DEFAULT_TICKET_FILTERS };
                setDraftFilters(nextFilters);
                setFeedback(null);
                setIsListLoading(true);
                try {
                  await syncWorkspace(nextFilters, selectedTicketId);
                } catch (error) {
                  setFeedback({
                    tone: "error",
                    message: getTicketErrorMessage(error, "Could not reset the ticket filters."),
                  });
                } finally {
                  setIsListLoading(false);
                }
              }}
            />

            <TicketList
              role={currentRole}
              currentUserId={currentUser.id}
              tickets={visibleTickets}
              totalTickets={tickets.length}
              activeViewLabel={activeQuickViewLabel}
              emptyStateMessage={emptyStateMessage}
              selectedTicketId={selectedTicketId}
              busy={isListLoading}
              onSelect={async (ticketId) => {
                await handleSelectTicket(ticketId);
              }}
            />
          </section>

          <section ref={detailSectionRef} className="scroll-mt-28 space-y-5">
            <div className="px-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Selected ticket workspace
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Inspect, communicate, and act
                </h2>
                {selectedBundle ? (
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                    {selectedBundle.detail.ticketNumber}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {selectedBundle
                  ? "Review the selected issue context, people, timers, comments, and evidence images in one place."
                  : "Choose a ticket from the queue to open the full detail workspace."}
              </p>
            </div>

            <TicketDetailPanel
              currentUser={currentUser}
              ticketBundle={selectedBundle}
              detailLoading={isDetailLoading}
              busy={isMutating}
              onOpenEdit={() => setEditDialogOpen(true)}
              onOpenAssignment={() => setAssignmentDialogOpen(true)}
              onOpenStatus={() => setStatusDialogOpen(true)}
              onDeleteTicket={async () => {
                if (selectedTicketId == null) return;

                const deletedTicketNumber =
                  selectedBundle?.detail.ticketNumber ?? `Ticket #${selectedTicketId}`;
                setFeedback(null);
                setIsMutating(true);
                try {
                  await deleteTicketClient(selectedTicketId);
                  await syncWorkspace(filters, null);
                  setFeedback({
                    tone: "success",
                    message:
                      currentRole === "ADMIN"
                        ? `${deletedTicketNumber} deleted successfully.`
                        : `${deletedTicketNumber} withdrawn successfully.`,
                  });
                } catch (error) {
                  setFeedback({
                    tone: "error",
                    message: getTicketErrorMessage(error, "Could not remove the ticket."),
                  });
                } finally {
                  setIsMutating(false);
                }
              }}
              onRequestReconsideration={async (note) => {
                if (selectedTicketId == null) return;

                setFeedback(null);
                setIsMutating(true);
                try {
                  await requestTicketReconsiderationClient(selectedTicketId, { note });
                  await syncWorkspace(filters, selectedTicketId);
                  setFeedback({
                    tone: "success",
                    message: "Reconsideration request sent to admin for review.",
                  });
                } catch (error) {
                  setFeedback({
                    tone: "error",
                    message: getTicketErrorMessage(
                      error,
                      "Could not send the reconsideration request.",
                    ),
                  });
                  throw error;
                } finally {
                  setIsMutating(false);
                }
              }}
              onCreateComment={async (payload: CreateTicketCommentRequest) => {
                if (selectedTicketId == null) return;

                setIsMutating(true);
                try {
                  await createTicketCommentClient(selectedTicketId, payload);
                  await refreshSelectedBundle(selectedTicketId);
                  setFeedback({
                    tone: "success",
                    message:
                      payload.commentType === "INTERNAL_NOTE"
                        ? "Internal note added."
                        : "Ticket comment posted.",
                  });
                } catch (error) {
                  throw error;
                } finally {
                  setIsMutating(false);
                }
              }}
              onUpdateComment={async (
                commentId: number,
                payload: UpdateTicketCommentRequest,
              ) => {
                if (selectedTicketId == null) return;

                setIsMutating(true);
                try {
                  await updateTicketCommentClient(selectedTicketId, commentId, payload);
                  await refreshSelectedBundle(selectedTicketId);
                  setFeedback({
                    tone: "success",
                    message: "Comment updated.",
                  });
                } catch (error) {
                  throw error;
                } finally {
                  setIsMutating(false);
                }
              }}
              onDeleteComment={async (commentId: number) => {
                if (selectedTicketId == null) return;

                setIsMutating(true);
                try {
                  await deleteTicketCommentClient(selectedTicketId, commentId);
                  await refreshSelectedBundle(selectedTicketId);
                  setFeedback({
                    tone: "success",
                    message: "Comment deleted.",
                  });
                } catch (error) {
                  throw error;
                } finally {
                  setIsMutating(false);
                }
              }}
              onCreateAttachment={async (payload) => {
                if (selectedTicketId == null) return;

                setIsMutating(true);
                try {
                  await createTicketAttachmentClient(selectedTicketId, payload);
                  await refreshSelectedBundle(selectedTicketId);
                  setFeedback({
                    tone: "success",
                    message: "Attachment image uploaded.",
                  });
                } catch (error) {
                  throw error;
                } finally {
                  setIsMutating(false);
                }
              }}
              onDeleteAttachment={async (attachmentId) => {
                if (selectedTicketId == null) return;

                setFeedback(null);
                setIsMutating(true);
                try {
                  await deleteTicketAttachmentClient(selectedTicketId, attachmentId);
                  await refreshSelectedBundle(selectedTicketId);
                  setFeedback({
                    tone: "success",
                    message: "Attachment image deleted.",
                  });
                } catch (error) {
                  setFeedback({
                    tone: "error",
                    message: getTicketErrorMessage(
                      error,
                      "Could not delete the attachment image.",
                    ),
                  });
                } finally {
                  setIsMutating(false);
                }
              }}
            />
          </section>
        </div>

        <section ref={analyticsSectionRef} className="scroll-mt-28 space-y-5">
          <div className="px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Analytics workspace
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Review trends, pressure, and hotspots
              </h2>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                Based on current role scope
              </span>
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              This section turns the current ticket workspace into charts and operational signals
              so student, staff, and admin users can understand what needs attention without
              reading the queue row by row.
            </p>
          </div>

          <TicketAnalyticsPanel
            tickets={tickets}
            currentUser={currentUser}
            categories={categories}
          />
        </section>

        <section ref={reportsSectionRef} className="scroll-mt-28 space-y-5">
          <div className="px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Reports and assistant
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Generate downloads and guided summaries
              </h2>
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Build formal ticket reports, review previous downloads, and use the student
              assistant where it is enabled.
            </p>
          </div>

          <TicketReportsPanel
            currentUser={currentUser}
            categories={categories}
            locations={initialLocations}
            resources={initialResources}
            staffUsers={initialStaffUsers}
            reporterUsers={initialReporterUsers}
            selectedTicket={selectedBundle?.detail ?? null}
            initialReports={initialReports}
            onSelectTicket={handleSelectTicket}
          />
        </section>
      </section>

      {createDialogOpen ? (
        <CreateTicketForm
          key="create-ticket"
          open={createDialogOpen}
          busy={isMutating}
          currentRole={currentRole}
          categories={categories}
          locations={initialLocations}
          resources={initialResources}
          reporterUsers={initialReporterUsers}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={async (submission: CreateTicketSubmission) => {
            setFeedback(null);
            setIsMutating(true);

            let createdTicketNumber: string | null = null;
            let createdTicketId: number | null = null;

            try {
              const createdTicket = await createTicketClient(submission.request);
              createdTicketNumber = createdTicket.ticketNumber;
              createdTicketId = createdTicket.id;

              for (const attachment of submission.attachments) {
                await createTicketAttachmentClient(createdTicket.id, attachment);
              }

              const nextFilters = { ...DEFAULT_TICKET_FILTERS };
              await syncWorkspace(nextFilters, createdTicket.id);
              setQuickView("ALL");

              setFeedback({
                tone: "success",
                message:
                  submission.attachments.length > 0
                    ? `${createdTicket.ticketNumber} created with ${submission.attachments.length} image attachment(s).`
                    : `${createdTicket.ticketNumber} created successfully.`,
              });
              setCreateDialogOpen(false);
              scrollToSection(detailSectionRef.current);
            } catch (error) {
              if (createdTicketId != null && createdTicketNumber) {
                try {
                  const nextFilters = { ...DEFAULT_TICKET_FILTERS };
                  await syncWorkspace(nextFilters, createdTicketId);
                  setQuickView("ALL");
                } catch {
                  // Best effort refresh after partial success.
                }

                setCreateDialogOpen(false);
                setFeedback({
                  tone: "error",
                  message: `${createdTicketNumber} was created, but one or more images could not be uploaded: ${getTicketErrorMessage(error, "Unknown error.")}`,
                });
                return;
              }

              if (!(error instanceof TicketApiError && Object.keys(error.validationErrors).length > 0)) {
                setFeedback({
                  tone: "error",
                  message: getTicketErrorMessage(error, "Could not create the ticket."),
                });
              }

              throw error;
            } finally {
              setIsMutating(false);
            }
          }}
        />
      ) : null}

      {editDialogOpen ? (
        <EditTicketDialog
          key={`edit-${selectedBundle?.detail.id ?? "none"}-${selectedBundle?.detail.updatedAt ?? "none"}`}
          open={editDialogOpen}
          busy={isMutating}
          ticket={selectedBundle?.detail ?? null}
          categories={categories}
          locations={initialLocations}
          resources={initialResources}
          onClose={() => setEditDialogOpen(false)}
          onSubmit={async (payload) => {
            if (selectedTicketId == null) return;

            setFeedback(null);
            setIsMutating(true);
            try {
              await updateTicketClient(selectedTicketId, payload);
              await syncWorkspace(filters, selectedTicketId);
              setFeedback({
                tone: "success",
                message: "Ticket details updated.",
              });
            } catch (error) {
              throw error;
            } finally {
              setIsMutating(false);
            }
          }}
        />
      ) : null}

      {assignmentDialogOpen ? (
        <AssignmentDialog
          key={`assignment-${selectedBundle?.detail.id ?? "none"}`}
          open={assignmentDialogOpen}
          busy={isMutating}
          ticket={selectedBundle?.detail ?? null}
          staffUsers={initialStaffUsers}
          onClose={() => setAssignmentDialogOpen(false)}
          onSubmit={async (payload) => {
            if (selectedTicketId == null) return;

            setFeedback(null);
            setIsMutating(true);
            try {
              await updateTicketAssignmentClient(selectedTicketId, payload);
              await syncWorkspace(filters, selectedTicketId);
              setFeedback({
                tone: "success",
                message:
                  selectedBundle?.detail.status === "REJECTED"
                    ? "Ticket reopened and assigned for another check."
                    : "Ticket assignment saved.",
              });
            } catch (error) {
              throw error;
            } finally {
              setIsMutating(false);
            }
          }}
        />
      ) : null}

      {statusDialogOpen ? (
        <StatusUpdateDialog
          key={`status-${selectedBundle?.detail.id ?? "none"}-${selectedBundle?.detail.status ?? "none"}`}
          open={statusDialogOpen}
          busy={isMutating}
          role={currentRole}
          ticket={selectedBundle?.detail ?? null}
          onClose={() => setStatusDialogOpen(false)}
          onSubmit={async (payload) => {
            if (selectedTicketId == null) return;

            setFeedback(null);
            setIsMutating(true);
            try {
              await updateTicketStatusClient(selectedTicketId, payload);
              await syncWorkspace(filters, selectedTicketId);
              setFeedback({
                tone: "success",
                message: "Ticket status updated.",
              });
            } catch (error) {
              throw error;
            } finally {
              setIsMutating(false);
            }
          }}
        />
      ) : null}

      {categoryDialogOpen ? (
        <TicketCategoryManager
          key={`categories-${categories.map((category) => `${category.id}-${category.isActive}`).join("|")}`}
          open={categoryDialogOpen}
          busy={isMutating}
          categories={categories}
          onClose={() => setCategoryDialogOpen(false)}
          onCreate={async (payload) => {
            setFeedback(null);
            setIsMutating(true);
            try {
              const detail = await createTicketCategoryClient(payload);
              await refreshCategories();
              await syncWorkspace(filters, selectedTicketId);
              setFeedback({
                tone: "success",
                message: "Ticket category created.",
              });
              return detail;
            } finally {
              setIsMutating(false);
            }
          }}
          onUpdate={async (categoryId, payload) => {
            setFeedback(null);
            setIsMutating(true);
            try {
              const detail = await updateTicketCategoryClient(categoryId, payload);
              await refreshCategories();
              await syncWorkspace(filters, selectedTicketId);
              setFeedback({
                tone: "success",
                message: "Ticket category updated.",
              });
              return detail;
            } finally {
              setIsMutating(false);
            }
          }}
          onDelete={async (categoryId) => {
            setFeedback(null);
            setIsMutating(true);
            try {
              await deleteTicketCategoryClient(categoryId);
              const nextCategories = await refreshCategories();

              const nextFilters: Required<TicketFilterValues> =
                filters.ticketCategoryId &&
                !nextCategories.some((category) => category.id === filters.ticketCategoryId)
                  ? { ...filters, ticketCategoryId: "" }
                  : filters;

              await syncWorkspace(nextFilters, selectedTicketId);
              setFeedback({
                tone: "success",
                message: "Ticket category deleted.",
              });
            } catch (error) {
              setFeedback({
                tone: "error",
                message: getTicketErrorMessage(error, "Could not delete the ticket category."),
              });
            } finally {
              setIsMutating(false);
            }
          }}
        />
      ) : null}
    </>
  );
}
