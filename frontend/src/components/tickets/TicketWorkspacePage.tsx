"use client";

import { useEffect, useState } from "react";

import { AssignmentDialog } from "@/components/tickets/AssignmentDialog";
import { CreateTicketForm } from "@/components/tickets/CreateTicketForm";
import { EditTicketDialog } from "@/components/tickets/EditTicketDialog";
import { StatusUpdateDialog } from "@/components/tickets/StatusUpdateDialog";
import { TicketCategoryManager } from "@/components/tickets/TicketCategoryManager";
import { TicketDetailPanel } from "@/components/tickets/TicketDetailPanel";
import { TicketFilters } from "@/components/tickets/TicketFilters";
import { TicketList } from "@/components/tickets/TicketList";
import { TicketAnalyticsPanel } from "@/components/tickets/TicketAnalyticsPanel";
import { TicketPopupNotice } from "@/components/tickets/TicketPopupDialogs";
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
  filterTicketsByAge,
  getAwaitingFirstResponseCount,
  getFirstResponseTimerState,
  getInProgressTicketCount,
  getOpenTicketCount,
  getResolutionTimerState,
  getResolvedTicketCount,
  getSlaRiskTicketCount,
  getTicketErrorMessage,
  getUnassignedTicketCount,
  isArchivedTicket,
  parseTicketDateValue,
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

type FeedbackState = {
  tone: "success" | "error";
  title?: string;
  message: string;
  details?: string[];
} | null;

type TicketWorkspaceSection =
  | "queue"
  | "detail"
  | "archive"
  | "analytics"
  | "reports";
type TicketQuickView = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "FOCUS";
type SnapshotTone = "slate" | "sky" | "amber" | "emerald" | "rose";

const TICKET_WORKSPACE_SECTIONS: TicketWorkspaceSection[] = [
  "queue",
  "detail",
  "archive",
  "analytics",
  "reports",
];

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

function getQuickViewLabel(
  quickView: TicketQuickView,
  focusMetricLabel: string,
): string {
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
        return `${baseClass} border-cyan-400/70 bg-[linear-gradient(135deg,rgba(15,118,110,0.98),rgba(14,116,144,0.96),rgba(67,56,202,0.96))] text-white shadow-[0_18px_55px_rgba(14,116,144,0.24)]`;
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
      return (
        !ticket.assignedStaffUserId &&
        !["CLOSED", "REJECTED"].includes(ticket.status)
      );
    case "STAFF": {
      const firstResponseState = getFirstResponseTimerState(ticket, nowMs);
      const resolutionState = getResolutionTimerState(ticket, nowMs);
      return (
        firstResponseState.tone === "danger" ||
        resolutionState.tone === "danger"
      );
    }
    case "STUDENT":
      return (
        !ticket.firstRespondedAt &&
        !["CLOSED", "REJECTED"].includes(ticket.status)
      );
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

function getQueueAgeFilteredTickets(
  tickets: TicketSummary[],
  age: Required<TicketFilterValues>["age"],
  nowMs: number,
) {
  if (age === "ARCHIVED") {
    return tickets.filter((ticket) => isArchivedTicket(ticket));
  }

  const activeTickets = tickets.filter((ticket) => !isArchivedTicket(ticket));
  return filterTicketsByAge(activeTickets, age, nowMs);
}

function isTicketWorkspaceSection(
  value: string,
): value is TicketWorkspaceSection {
  return TICKET_WORKSPACE_SECTIONS.includes(value as TicketWorkspaceSection);
}

function formatTicketSelectorDate(value: string) {
  try {
    const parsedDate = parseTicketDateValue(value);
    if (parsedDate == null) {
      return value;
    }

    return new Intl.DateTimeFormat("en-LK", {
      dateStyle: "medium",
    }).format(new Date(parsedDate));
  } catch {
    return value;
  }
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
  const [tickets, setTickets] = useState(initialTickets);
  const [categories, setCategories] = useState(initialCategories);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(
    initialSelectedBundle?.detail.id ?? initialTickets[0]?.id ?? null,
  );
  const [selectedBundle, setSelectedBundle] = useState<TicketBundle | null>(
    initialSelectedBundle,
  );
  const [filters, setFilters] = useState<Required<TicketFilterValues>>({
    ...DEFAULT_TICKET_FILTERS,
  });
  const [draftFilters, setDraftFilters] = useState<
    Required<TicketFilterValues>
  >({
    ...DEFAULT_TICKET_FILTERS,
  });
  const [activeSection, setActiveSection] =
    useState<TicketWorkspaceSection>("queue");
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

  useEffect(() => {
    const sectionFromHash = window.location.hash.replace("#", "").toLowerCase();
    if (sectionFromHash && isTicketWorkspaceSection(sectionFromHash)) {
      setActiveSection(sectionFromHash);
    }
  }, []);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    currentUrl.hash = activeSection === "queue" ? "" : activeSection;
    window.history.replaceState(
      window.history.state,
      "",
      `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
    );
  }, [activeSection]);

  const nowMs = Date.now();

  const archivedTickets = tickets.filter((ticket) => isArchivedTicket(ticket));
  const ageFilteredTickets = getQueueAgeFilteredTickets(
    tickets,
    filters.age,
    nowMs,
  );
  const openCount = getOpenTicketCount(ageFilteredTickets);
  const inProgressCount = getInProgressTicketCount(ageFilteredTickets);
  const resolvedCount = getResolvedTicketCount(ageFilteredTickets);
  const unassignedCount = getUnassignedTicketCount(ageFilteredTickets);
  const awaitingFirstResponseCount = getAwaitingFirstResponseCount(ageFilteredTickets);
  const slaRiskCount = getSlaRiskTicketCount(ageFilteredTickets, nowMs);
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
    currentRole === "ADMIN"
      ? "amber"
      : currentRole === "STAFF"
        ? "rose"
        : "sky";
  const activeQuickViewLabel = getQuickViewLabel(quickView, focusMetricLabel);
  const visibleTickets = getTicketsForQuickView(
    ageFilteredTickets,
    quickView,
    currentRole,
    nowMs,
  );
  const emptyStateMessage =
    tickets.length === 0
      ? "No tickets match the current role scope and server filters."
      : filters.age === "ARCHIVED"
        ? "No closed tickets have been archived yet."
        : "No active tickets match the selected queue filters or quick view. Adjust the queue filters or clear the quick view.";
  const sectionNavItems = [
    {
      id: "queue" as const,
      label: "Queue",
      description: `${visibleTickets.length} shown`,
    },
    {
      id: "detail" as const,
      label: "Selected ticket",
      description: selectedBundle
        ? selectedBundle.detail.ticketNumber
        : "Open a ticket from the queue",
    },
    {
      id: "archive" as const,
      label: "Archive",
      description: `${archivedTickets.length} closed`,
    },
    {
      id: "analytics" as const,
      label: "Analytics",
      description: "Trends and pressure signals",
    },
    {
      id: "reports" as const,
      label: "Reports",
      description: "Downloads and guided summaries",
    },
  ];

  async function syncWorkspace(
    nextFilters: Required<TicketFilterValues>,
    preferredTicketId: number | null,
  ) {
    const filtersToUse = { ...nextFilters };
    const nextTickets = await listTicketsClient(filtersToUse);
    const nextNowMs = Date.now();
    const nextAgeFilteredTickets = getQueueAgeFilteredTickets(
      nextTickets,
      filtersToUse.age,
      nextNowMs,
    );
    const nextVisibleTickets = getTicketsForQuickView(
      nextAgeFilteredTickets,
      quickView,
      currentRole,
      nextNowMs,
    );
    const shouldPreserveSelectedTicket =
      activeSection !== "queue" &&
      preferredTicketId != null &&
      nextTickets.some((ticket) => ticket.id === preferredTicketId);
    const nextSelectedTicketId = shouldPreserveSelectedTicket
      ? preferredTicketId
      : resolveSelectedTicketId(nextVisibleTickets, preferredTicketId);
    const nextBundle =
      nextSelectedTicketId == null
        ? null
        : await getTicketBundleClient(nextSelectedTicketId);

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

  async function refreshQueue() {
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
  }

  async function applyQuickView(nextQuickView: TicketQuickView) {
    const resolvedQuickView =
      nextQuickView === quickView && nextQuickView !== "ALL"
        ? "ALL"
        : nextQuickView;
    const nextNowMs = Date.now();
    const nextAgeFilteredTickets = getQueueAgeFilteredTickets(
      tickets,
      filters.age,
      nextNowMs,
    );
    const nextVisibleTickets = getTicketsForQuickView(
      nextAgeFilteredTickets,
      resolvedQuickView,
      currentRole,
      nextNowMs,
    );
    const nextSelectedTicketId = resolveSelectedTicketId(
      nextVisibleTickets,
      selectedTicketId,
    );

    setQuickView(resolvedQuickView);
    setSelectedTicketId(nextSelectedTicketId);
    setFeedback(null);
    setActiveSection("queue");

    if (nextSelectedTicketId == null) {
      setSelectedBundle(null);
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
  }

  async function handleSelectTicket(ticketId: number) {
    setFeedback(null);
    setSelectedTicketId(ticketId);
    setIsDetailLoading(true);
    try {
      setSelectedBundle(await getTicketBundleClient(ticketId));
      setActiveSection("detail");
    } catch (error) {
      setFeedback({
        tone: "error",
        message: getTicketErrorMessage(
          error,
          "Could not load the selected ticket.",
        ),
      });
    } finally {
      setIsDetailLoading(false);
    }
  }

  return (
    <div className="ticketing-workspace">
      <section className="space-y-8">
        <section className="rounded-[1.9rem] border border-white/70 bg-white/85 p-8 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-8">
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
                  Use the ticket navigation bar below to open the queue,
                  selected ticket, analytics, and reporting areas as separate
                  workspace views.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 xl:justify-end">
                {currentRole !== "ADMIN" ? (
                  <button
                    type="button"
                    onClick={() => setCreateDialogOpen(true)}
                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Report issue
                  </button>
                ) : null}
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
                  onClick={refreshQueue}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Refresh queue
                </button>
              </div>
            </div>

            <nav
              aria-label="Ticket workspace sections"
              className="rounded-[1.6rem] border border-slate-200/80 bg-slate-50/80 p-2"
            >
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {sectionNavItems.map((section) => {
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setActiveSection(section.id)}
                      className={`rounded-[1.2rem] border px-4 py-4 text-left transition ${
                        isActive
                          ? "border-cyan-400/70 bg-[linear-gradient(135deg,rgba(15,118,110,0.98),rgba(14,116,144,0.96),rgba(67,56,202,0.96))] text-white shadow-[0_18px_40px_rgba(14,116,144,0.22)]"
                          : "border-transparent bg-white/90 text-slate-900 hover:border-slate-200 hover:bg-white"
                      }`}
                    >
                      <span
                        className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                          isActive ? "text-white/70" : "text-slate-500"
                        }`}
                      >
                        {section.label}
                      </span>
                      <p
                        className={`mt-2 text-sm leading-6 ${
                          isActive ? "text-white" : "text-slate-600"
                        }`}
                      >
                        {section.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        </section>

        <div className="space-y-8">
          {activeSection === "queue" ? (
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
                    These are quick queue controls, not the full analytics
                    dashboard. Clicking a card changes only the queue view
                    below, so you can narrow work fast without losing your
                    search and filter setup.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                    Viewing: {activeQuickViewLabel}
                  </div>
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

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {[
                  {
                    id: "ALL" as const,
                    label: "Tickets in scope",
                    value: ageFilteredTickets.length,
                    tone: "slate" as const,
                    description:
                      "Every ticket returned by the current queue filters.",
                  },
                  {
                    id: "OPEN" as const,
                    label: "Open",
                    value: openCount,
                    tone: "sky" as const,
                    description:
                      "Freshly reported incidents waiting for active handling.",
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
                    description:
                      "Tickets fixed by staff and ready for final closure steps.",
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
                              isActive && card.tone === "slate"
                                ? "text-white/80"
                                : "text-slate-600"
                            }`}
                          >
                            {card.label}
                          </p>
                          <p className="mt-3 text-3xl font-semibold tracking-tight">
                            {card.value}
                          </p>
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
                          isActive && card.tone === "slate"
                            ? "text-white/80"
                            : "text-slate-600"
                        }`}
                      >
                        {card.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {activeSection === "queue" ? (
            <section className="space-y-5">
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
                    {visibleTickets.length !== ageFilteredTickets.length
                      ? ` / ${ageFilteredTickets.length}`
                      : ""}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {getQuickViewDescription(
                    quickView,
                    focusMetricLabel,
                    currentRole,
                  )}
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
                      message: getTicketErrorMessage(
                        error,
                        "Could not apply ticket filters.",
                      ),
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
                      message: getTicketErrorMessage(
                        error,
                        "Could not reset the ticket filters.",
                      ),
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
                totalTickets={ageFilteredTickets.length}
                activeViewLabel={activeQuickViewLabel}
                emptyStateMessage={emptyStateMessage}
                selectedTicketId={selectedTicketId}
                busy={isListLoading}
                onSelect={async (ticketId) => {
                  await handleSelectTicket(ticketId);
                }}
              />
            </section>
          ) : null}

          {activeSection === "archive" ? (
            <section className="space-y-5">
              <div className="px-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Archived ticket section
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                    Review automatically archived closed tickets
                  </h2>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                    {archivedTickets.length} archived
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Tickets move here automatically as soon as an admin closes them.
                  They stay out of the active queue, but you can still open any
                  archived ticket from here for review.
                </p>
              </div>

              <TicketList
                role={currentRole}
                currentUserId={currentUser.id}
                tickets={archivedTickets}
                totalTickets={archivedTickets.length}
                activeViewLabel="Archived closed tickets"
                emptyStateMessage="No closed tickets have been archived yet."
                selectedTicketId={selectedTicketId}
                busy={isListLoading}
                onSelect={async (ticketId) => {
                  await handleSelectTicket(ticketId);
                }}
              />
            </section>
          ) : null}

          {activeSection === "detail" ? (
            <section className="space-y-5">
              <div className="px-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Selected ticket workspace
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                    Inspect, communicate, and act
                  </h2>
                  {tickets.length > 1 ? (
                    <div className="w-full max-w-md">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Switch ticket
                        </span>
                        <select
                          aria-label="Select another ticket"
                          value={selectedTicketId == null ? "" : String(selectedTicketId)}
                          disabled={isDetailLoading || isMutating}
                          onChange={(event) => {
                            const nextTicketId = Number(event.target.value);
                            if (Number.isFinite(nextTicketId)) {
                              void handleSelectTicket(nextTicketId);
                            }
                          }}
                          className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)] outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {selectedTicketId == null ? (
                            <option value="">Choose a ticket</option>
                          ) : null}
                          {tickets.map((ticket) => (
                            <option key={ticket.id} value={ticket.id}>
                              {`${ticket.title} • ${formatTicketSelectorDate(ticket.createdAt)}`}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : selectedBundle ? (
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
                key={`${selectedBundle?.detail.id ?? "empty"}-${selectedBundle?.detail.updatedAt ?? "none"}`}
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
                    selectedBundle?.detail.ticketNumber ??
                    `Ticket #${selectedTicketId}`;
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
                      message: getTicketErrorMessage(
                        error,
                        "Could not remove the ticket.",
                      ),
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
                    await requestTicketReconsiderationClient(selectedTicketId, {
                      note,
                    });
                    await syncWorkspace(filters, selectedTicketId);
                    setFeedback({
                      tone: "success",
                      message:
                        "Reconsideration request sent to admin for review.",
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
                onCreateComment={async (
                  payload: CreateTicketCommentRequest,
                ) => {
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
                    await updateTicketCommentClient(
                      selectedTicketId,
                      commentId,
                      payload,
                    );
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
                    await deleteTicketCommentClient(
                      selectedTicketId,
                      commentId,
                    );
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
                    await createTicketAttachmentClient(
                      selectedTicketId,
                      payload,
                    );
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
                    await deleteTicketAttachmentClient(
                      selectedTicketId,
                      attachmentId,
                    );
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
          ) : null}

          {activeSection === "analytics" ? (
            <section className="space-y-5">
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
                  This section turns the current ticket workspace into charts
                  and operational signals so student, staff, and admin users can
                  understand what needs attention without reading the queue row
                  by row.
                </p>
              </div>

              <TicketAnalyticsPanel
                tickets={tickets}
                currentUser={currentUser}
                categories={categories}
              />
            </section>
          ) : null}

          {activeSection === "reports" ? (
            <section>
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
          ) : null}
        </div>
      </section>

      {currentRole !== "ADMIN" && createDialogOpen ? (
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
              const createdTicket = await createTicketClient(
                submission.request,
              );
              createdTicketNumber = createdTicket.ticketNumber;
              createdTicketId = createdTicket.id;

              for (const attachment of submission.attachments) {
                await createTicketAttachmentClient(
                  createdTicket.id,
                  attachment,
                );
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
              setActiveSection("detail");
              setCreateDialogOpen(false);
            } catch (error) {
              if (createdTicketId != null && createdTicketNumber) {
                try {
                  const nextFilters = { ...DEFAULT_TICKET_FILTERS };
                  await syncWorkspace(nextFilters, createdTicketId);
                  setQuickView("ALL");
                  setActiveSection("detail");
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

              if (
                !(
                  error instanceof TicketApiError &&
                  Object.keys(error.validationErrors).length > 0
                )
              ) {
                setFeedback({
                  tone: "error",
                  message: getTicketErrorMessage(
                    error,
                    "Could not create the ticket.",
                  ),
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
              const detail = await updateTicketCategoryClient(
                categoryId,
                payload,
              );
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
                !nextCategories.some(
                  (category) => category.id === filters.ticketCategoryId,
                )
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
                message: getTicketErrorMessage(
                  error,
                  "Could not delete the ticket category.",
                ),
              });
            } finally {
              setIsMutating(false);
            }
          }}
        />
      ) : null}

      <TicketPopupNotice
        notice={feedback}
        onClose={() => setFeedback(null)}
        actionLabel={feedback?.tone === "success" ? "Close" : "Review"}
      />
    </div>
  );
}
