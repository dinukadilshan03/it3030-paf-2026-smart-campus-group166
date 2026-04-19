"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { TicketPopupNotice } from "@/components/tickets/TicketPopupDialogs";
import {
  downloadTicketReportClient,
  generateTicketReportClient,
  getTicketDetailClient,
  listTicketsClient,
  queryTicketAssistantClient,
} from "@/lib/tickets/client";
import {
  formatDateTime,
  getLocationLabel,
  getResourceLabel,
  getTicketErrorMessage,
  toTicketTitleCase,
} from "@/lib/tickets/shared";
import type {
  GenerateTicketReportRequest,
  TicketAssistantResponse,
  TicketCategorySummary,
  TicketDetail,
  TicketLocationOption,
  TicketPriority,
  TicketReportFormat,
  TicketReportRecord,
  TicketReportType,
  TicketResourceOption,
  TicketStatus,
} from "@/lib/tickets/types";
import type { AdminUserSummary } from "@/lib/users/types";
import type { CurrentUser } from "@/types/auth";
import roboGif from "@/images/robo.gif";

type Props = {
  currentUser: CurrentUser;
  categories: TicketCategorySummary[];
  locations: TicketLocationOption[];
  resources: TicketResourceOption[];
  staffUsers: AdminUserSummary[];
  reporterUsers: AdminUserSummary[];
  selectedTicket: TicketDetail | null;
  initialReports: TicketReportRecord[];
  onSelectTicket?: (ticketId: number) => void | Promise<void>;
};

type FormState = {
  reportType: TicketReportType;
  format: TicketReportFormat;
  ticketId: string;
  ticketNumber: string;
  status: TicketStatus | "";
  priority: TicketPriority | "";
  ticketCategoryId: string;
  locationId: string;
  resourceId: string;
  assignedStaffUserId: string;
  reporterUserId: string;
  startDate: string;
  endDate: string;
  naturalLanguageRequest: string;
};

const INPUT =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200";
const LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500";
const STATUSES: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
];
const PRIORITIES: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const CHAT_HISTORY_STORAGE_KEY = "smartcampus-ticket-report-chat-history";

type AssistantBlock =
  | { type: "paragraph"; lines: string[] }
  | { type: "list"; items: string[] };

type AssistantChatTurn = {
  id: string;
  prompt: string;
  response: TicketAssistantResponse;
};

type AssistantChatSession = {
  id: string;
  title: string;
  turns: AssistantChatTurn[];
  createdAt: string;
  updatedAt: string;
  ticketId: number | null;
  ticketNumber: string | null;
  ticketTitle: string | null;
};

type StoredAssistantChatState = {
  sessions: AssistantChatSession[];
  activeChatId: string | null;
  chatActivated: boolean;
};

type DetailReportPreview = {
  ticketNumber: string | null;
  ticketTitle: string | null;
};

function initialForm(selectedTicket: TicketDetail | null): FormState {
  return {
    reportType: selectedTicket ? "DETAIL" : "SUMMARY",
    format: "PDF",
    ticketId: selectedTicket ? String(selectedTicket.id) : "",
    ticketNumber: selectedTicket?.ticketNumber ?? "",
    status: "",
    priority: "",
    ticketCategoryId: "",
    locationId: "",
    resourceId: "",
    assignedStaffUserId: "",
    reporterUserId: "",
    startDate: "",
    endDate: "",
    naturalLanguageRequest: "",
  };
}

function parseId(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeTicketNumber(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

function buildChatSessionTitle(
  prompt: string,
  selectedTicket: TicketDetail | null,
) {
  const condensedPrompt = prompt.replace(/\s+/g, " ").trim();
  const base = selectedTicket
    ? `${selectedTicket.title}: ${condensedPrompt}`
    : condensedPrompt;
  return truncateAssistantContext(base, 70);
}

function getReportTitleLine(
  report: Pick<TicketReportRecord, "ticketNumber" | "ticketTitle">,
) {
  if (report.ticketTitle?.trim()) {
    return report.ticketTitle.trim();
  }

  if (report.ticketNumber?.trim()) {
    return report.ticketNumber.trim();
  }

  return null;
}

function getReportTicketLine(
  report: Pick<TicketReportRecord, "ticketNumber" | "ticketTitle">,
) {
  if (report.ticketTitle?.trim() && report.ticketNumber?.trim()) {
    return report.ticketNumber.trim();
  }

  return null;
}

function matchesReportSearch(report: TicketReportRecord, search: string) {
  const normalized = search.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [
    report.fileName,
    report.generatedByDisplayName,
    report.ticketNumber,
    report.ticketTitle,
    report.filterSummary,
    report.summaryText,
    report.naturalLanguageRequest,
  ]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(normalized));
}

function isStoredChatSession(value: unknown): value is AssistantChatSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AssistantChatSession>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    Array.isArray(candidate.turns) &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string"
  );
}

function normalizeStoredChatState(value: unknown): StoredAssistantChatState {
  if (Array.isArray(value)) {
    const sessions = value.filter(isStoredChatSession).slice(0, 12) as AssistantChatSession[];
    return {
      sessions,
      activeChatId: sessions[0]?.id ?? null,
      chatActivated: sessions.length > 0,
    };
  }

  if (!value || typeof value !== "object") {
    return {
      sessions: [],
      activeChatId: null,
      chatActivated: false,
    };
  }

  const candidate = value as Partial<StoredAssistantChatState>;
  const sessions = Array.isArray(candidate.sessions)
    ? (candidate.sessions.filter(isStoredChatSession).slice(0, 12) as AssistantChatSession[])
    : [];
  const requestedActiveChatId =
    typeof candidate.activeChatId === "string" ? candidate.activeChatId : null;
  const requestedChatActivated = candidate.chatActivated === true;
  const activeChatId =
    requestedActiveChatId && sessions.some((session) => session.id === requestedActiveChatId)
      ? requestedActiveChatId
      : requestedChatActivated
        ? null
        : (sessions[0]?.id ?? null);

  return {
    sessions,
    activeChatId,
    chatActivated: requestedChatActivated || activeChatId != null,
  };
}

function toRequest(form: FormState): GenerateTicketReportRequest {
  const request: GenerateTicketReportRequest = {
    reportType: form.reportType,
    format: form.format,
  };
  if (form.reportType === "DETAIL") {
    if (parseId(form.ticketId) != null) request.ticketId = parseId(form.ticketId);
    if (form.ticketNumber.trim()) request.ticketNumber = form.ticketNumber.trim();
  }
  if (form.status) request.status = form.status;
  if (form.priority) request.priority = form.priority;
  if (parseId(form.ticketCategoryId) != null)
    request.ticketCategoryId = parseId(form.ticketCategoryId);
  if (parseId(form.locationId) != null)
    request.locationId = parseId(form.locationId);
  if (parseId(form.resourceId) != null)
    request.resourceId = parseId(form.resourceId);
  if (parseId(form.assignedStaffUserId) != null) {
    request.assignedStaffUserId = parseId(form.assignedStaffUserId);
  }
  if (parseId(form.reporterUserId) != null)
    request.reporterUserId = parseId(form.reporterUserId);
  if (form.startDate) request.startDate = form.startDate;
  if (form.endDate) request.endDate = form.endDate;
  if (form.naturalLanguageRequest.trim()) {
    request.naturalLanguageRequest = form.naturalLanguageRequest.trim();
  }
  return request;
}

function validate(request: GenerateTicketReportRequest) {
  if (
    request.reportType === "DETAIL" &&
    request.ticketId == null &&
    !request.ticketNumber?.trim()
  ) {
    throw new Error(
      "Choose a ticket or enter a ticket number for the detailed report.",
    );
  }
  if (
    request.startDate &&
    request.endDate &&
    request.startDate > request.endDate
  ) {
    throw new Error("Start date cannot be after end date.");
  }
}

function toFormStateFromRequest(
  request: GenerateTicketReportRequest,
  naturalLanguageRequest: string,
): FormState {
  return {
    reportType: request.reportType,
    format: request.format,
    ticketId: request.ticketId != null ? String(request.ticketId) : "",
    ticketNumber: request.ticketNumber ?? "",
    status: request.status ?? "",
    priority: request.priority ?? "",
    ticketCategoryId:
      request.ticketCategoryId != null ? String(request.ticketCategoryId) : "",
    locationId: request.locationId != null ? String(request.locationId) : "",
    resourceId: request.resourceId != null ? String(request.resourceId) : "",
    assignedStaffUserId:
      request.assignedStaffUserId != null
        ? String(request.assignedStaffUserId)
        : "",
    reporterUserId:
      request.reporterUserId != null ? String(request.reporterUserId) : "",
    startDate: request.startDate ?? "",
    endDate: request.endDate ?? "",
    naturalLanguageRequest,
  };
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function stripListMarker(value: string) {
  return value
    .replace(/^[-*•]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .trim();
}

function parseAssistantBlocks(
  text: string | null | undefined,
): AssistantBlock[] {
  if (!text?.trim()) {
    return [];
  }

  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
      const isList =
        lines.length > 1 &&
        lines.every((line) => /^[-*•]\s+|^\d+\.\s+/.test(line));

      if (isList) {
        return {
          type: "list" as const,
          items: lines.map(stripListMarker),
        };
      }

      return {
        type: "paragraph" as const,
        lines: lines.map(stripListMarker),
      };
    });
}

function buildAssistantSnapshot(
  tickets: TicketAssistantResponse["relatedTickets"],
) {
  if (tickets.length === 0) {
    return [];
  }

  return [
    { label: "Tickets", value: String(tickets.length) },
    {
      label: "Open",
      value: String(
        tickets.filter((ticket) => ticket.status === "OPEN").length,
      ),
    },
    {
      label: "In progress",
      value: String(
        tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
      ),
    },
    {
      label: "Resolved",
      value: String(
        tickets.filter((ticket) => ticket.status === "RESOLVED").length,
      ),
    },
  ];
}

function truncateAssistantContext(value: string, limit: number) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
}

function summarizeAssistantContext(response: TicketAssistantResponse) {
  const summaryParts = [
    response.title,
    ...response.highlights.slice(0, 2),
    response.reportSuggestionSummary,
    response.suggestedActions[0]
      ? `Suggested next step: ${response.suggestedActions[0]}.`
      : null,
    response.recommendedCategoryName
      ? `Category: ${response.recommendedCategoryName}.`
      : null,
    response.recommendedPriority
      ? `Priority: ${toTicketTitleCase(response.recommendedPriority)}.`
      : null,
  ].filter(Boolean);

  const fallbackMessage = response.message.replace(/\s+/g, " ").trim();
  const combined = (
    summaryParts.length > 0 ? summaryParts.join(" ") : fallbackMessage
  ).trim();
  return truncateAssistantContext(
    combined || "No assistant summary available.",
    380,
  );
}

function buildAssistantConversationPrompt(
  selectedTicket: TicketDetail | null,
  chatTurns: AssistantChatTurn[],
  prompt: string,
) {
  const recentTurns = chatTurns.slice(-3);
  const lines = [
    "Context only: continue this same student support chat naturally.",
    "Use the recent conversation to answer the latest request directly.",
    "Do not repeat the context back unless it helps the answer.",
  ];

  if (selectedTicket) {
    lines.push(
      `Selected ticket: ${selectedTicket.ticketNumber} | ${selectedTicket.title} | status ${toTicketTitleCase(selectedTicket.status)} | priority ${toTicketTitleCase(selectedTicket.priority)}${selectedTicket.ticketCategoryName ? ` | category ${selectedTicket.ticketCategoryName}` : ""}`,
    );
  }

  if (recentTurns.length > 0) {
    lines.push("Recent conversation:");
    recentTurns.forEach((turn, index) => {
      lines.push(`User ${index + 1}: ${turn.prompt}`);
      lines.push(
        `Assistant ${index + 1}: ${summarizeAssistantContext(turn.response)}`,
      );
    });
    lines.push(`Latest user follow-up: ${prompt}`);
  } else {
    lines.push(`Latest user request: ${prompt}`);
  }

  return lines.join("\n");
}

function renderAssistantMessage(text: string) {
  const blocks = parseAssistantBlocks(text);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3 text-sm leading-7 text-slate-200">
      {blocks.map((block, index) =>
        block.type === "list" ? (
          <ul
            key={`list-${index}`}
            className="space-y-2 rounded-[1.1rem] border border-slate-700 bg-slate-950/70 px-4 py-3"
          >
            {block.items.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div key={`paragraph-${index}`} className="space-y-2">
            {block.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ),
      )}
    </div>
  );
}

function getQuickPrompts(
  role: NonNullable<CurrentUser["role"]>,
  selectedTicket: TicketDetail | null,
) {
  return [
    selectedTicket
      ? {
          label: "Selected status",
          prompt: `What is the status of ticket ${selectedTicket.ticketNumber}?`,
        }
      : null,
    selectedTicket
      ? {
          label: "Selected timeline",
          prompt: `Summarize the history of ticket ${selectedTicket.ticketNumber}.`,
        }
      : null,
    selectedTicket
      ? {
          label: "Explain outcome",
          prompt: `Explain the resolution or rejection of ticket ${selectedTicket.ticketNumber}.`,
        }
      : null,
    selectedTicket
      ? {
          label: "Draft comment",
          prompt: `Draft a follow-up comment for ticket ${selectedTicket.ticketNumber}.`,
        }
      : null,
    {
      label: "My open tickets",
      prompt: `Which ${role === "ADMIN" ? "tickets are open right now" : "of my tickets are still open"}?`,
    },
    {
      label: "Ticket insights",
      prompt: "Show my ticket insights.",
    },
    {
      label: "Resolved report",
      prompt: `Generate ${role === "ADMIN" ? "an all-ticket" : "my"} resolved ticket report for this month.`,
    },
    {
      label: "Duplicate check",
      prompt:
        "Check whether a similar active ticket already exists for this issue: projector blue screen in Lab 3.",
    },
  ].filter(Boolean) as { label: string; prompt: string }[];
}

type StudentAssistantChatPanelProps = {
  selectedTicket: TicketDetail | null;
  quickPrompts: { label: string; prompt: string }[];
  welcomeCapabilities: string[];
  assistantPrompt: string;
  setAssistantPrompt: (value: string) => void;
  chatActivated: boolean;
  setChatActivated: (value: boolean) => void;
  chatSessions: AssistantChatSession[];
  activeChatId: string | null;
  chatTurns: AssistantChatTurn[];
  pendingPrompt: string | null;
  assistantBusy: boolean;
  generateBusy: boolean;
  onAsk: (promptOverride?: string) => void;
  onSelectChat: (sessionId: string) => void;
  onStartNewChat: () => void;
  onApplyReportSuggestion: (
    request: GenerateTicketReportRequest,
    naturalLanguageRequest: string,
  ) => void;
  onGenerateSuggestedReport: (request: GenerateTicketReportRequest) => void;
  onCopy: (text: string | null, label: string) => void;
  onSelectTicket?: (ticketId: number) => void | Promise<void>;
};

function StudentAssistantChatPanel({
  selectedTicket,
  quickPrompts,
  welcomeCapabilities,
  assistantPrompt,
  setAssistantPrompt,
  chatActivated,
  setChatActivated,
  chatSessions,
  activeChatId,
  chatTurns,
  pendingPrompt,
  assistantBusy,
  generateBusy,
  onAsk,
  onSelectChat,
  onStartNewChat,
  onApplyReportSuggestion,
  onGenerateSuggestedReport,
  onCopy,
  onSelectTicket,
}: StudentAssistantChatPanelProps) {
  const starterPrompts = quickPrompts.slice(0, 4);
  const followUpPrompts = quickPrompts.slice(4);
  const hasConversation = chatTurns.length > 0 || Boolean(pendingPrompt);
  const isConversationReady = chatActivated || hasConversation;

  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-slate-800/90 bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,0.2),transparent_24%),radial-gradient(circle_at_86%_10%,rgba(79,70,229,0.18),transparent_22%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.97),rgba(30,41,59,0.96))] p-6 shadow-[0_34px_100px_rgba(2,6,23,0.42)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_28%,rgba(56,189,248,0.08)_58%,rgba(129,140,248,0.1))]" />
      <div className="relative space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Student chatbot
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Chat naturally about your tickets and reports
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Ask questions in plain language, get friendly ticket explanations,
              draft follow-up replies, and turn assistant suggestions into
              downloadable reports.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTicket ? (
              <div className="rounded-[1.1rem] border border-slate-700 bg-slate-900/75 px-4 py-3 text-sm text-slate-100 shadow-[0_14px_30px_rgba(2,6,23,0.26)]">
                <p className="font-semibold">Selected ticket</p>
                <p className="mt-1 text-slate-300">
                  {selectedTicket.ticketNumber}
                </p>
              </div>
            ) : null}
            <button
              type="button"
              disabled={assistantBusy}
              onClick={onStartNewChat}
              className="rounded-full border border-slate-700 bg-slate-900/85 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-400/60 hover:bg-slate-900 disabled:opacity-60"
            >
              New chat
            </button>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-slate-800/90 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.88),rgba(30,41,59,0.92))] p-5 shadow-[0_24px_56px_rgba(2,6,23,0.34)]">
          <div className="grid gap-6 xl:grid-cols-[16rem_minmax(0,1fr)] xl:items-stretch">
            <div className="rounded-[1.65rem] border border-slate-800 bg-black p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_44px_rgba(2,6,23,0.45)]">
              <div className="flex h-full flex-col justify-between">
                <div className="inline-flex w-fit rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                  Always on guide
                </div>
                <div className="mt-4 flex flex-1 items-center justify-center rounded-[1.45rem] border border-slate-800 bg-black p-4">
                  <Image
                    src={roboGif}
                    alt="Student ticket assistant"
                    unoptimized
                    className="h-48 w-auto rounded-[1.25rem] object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[1.65rem] border border-slate-800 bg-[linear-gradient(135deg,rgba(15,23,42,0.9),rgba(30,41,59,0.86),rgba(15,23,42,0.94))] p-5 shadow-[0_20px_44px_rgba(2,6,23,0.26)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                  <span className="inline-flex rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
                    Good day!
                  </span>
                  <h4 className="mt-4 text-[2rem] font-semibold tracking-tight text-white">
                    I am your Smart Campus report assistant
                  </h4>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    I can help you understand ticket status, explain what
                    happened, suggest the right report, draft comments, and
                    point you to related tickets without making you search
                    through everything manually.
                  </p>
                </div>

                <div className="rounded-[1.2rem] border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 shadow-[0_10px_24px_rgba(5,150,105,0.1)]">
                  <p className="font-semibold">Follow-up ready</p>
                  <p className="mt-1 leading-6">
                    Ask things like &ldquo;what happened after that?&rdquo; or
                    &ldquo;make that shorter.&rdquo;
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {welcomeCapabilities.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.15rem] border border-slate-700 bg-slate-900/75 px-4 py-3 text-sm leading-6 text-slate-200 shadow-[0_10px_24px_rgba(2,6,23,0.2)]"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Start with
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {starterPrompts.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => void onAsk(item.prompt)}
                      className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-400/60 hover:bg-slate-900"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {chatSessions.length > 0 ? (
            <div className="mt-6 rounded-[1.5rem] border border-slate-800 bg-slate-950/65 p-4 shadow-[0_18px_42px_rgba(2,6,23,0.28)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Chat history
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Open an earlier conversation or start a new one anytime.
                  </p>
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">
                  {chatSessions.length} saved
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {chatSessions.slice(0, 6).map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    disabled={assistantBusy}
                    onClick={() => onSelectChat(session.id)}
                    className={`rounded-[1.2rem] border p-4 text-left transition ${
                      activeChatId === session.id
                        ? "border-sky-400/60 bg-sky-500/10 shadow-[0_14px_32px_rgba(14,116,144,0.16)]"
                        : "border-slate-700 bg-slate-900/80 hover:border-slate-500 hover:bg-slate-900"
                    } disabled:opacity-60`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-white">
                        {session.title}
                      </p>
                      {activeChatId === session.id ? (
                        <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-200">
                          Open
                        </span>
                      ) : null}
                    </div>
                    {session.ticketNumber ? (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {session.ticketNumber}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500">
                      {formatDateTime(session.updatedAt)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 rounded-[1.6rem] border border-slate-800 bg-[linear-gradient(180deg,rgba(2,6,23,0.92),rgba(15,23,42,0.94),rgba(30,41,59,0.92))] p-5 shadow-[0_18px_42px_rgba(2,6,23,0.32)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Live conversation
                </p>
                <h4 className="mt-2 text-xl font-semibold tracking-tight text-white">
                  Ask once, then keep going with follow-up questions
                </h4>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Continue one thread, switch back to an older chat, or start a
                  fresh conversation without losing the previous ones.
                </p>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-900/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-200 shadow-[0_8px_20px_rgba(2,6,23,0.22)]">
                {hasConversation ? "Conversation active" : "Ready to chat"}
              </span>
            </div>

            {chatTurns.length === 0 && !pendingPrompt ? (
              <div className="mt-5 rounded-[1.35rem] border border-dashed border-slate-700 bg-slate-900/70 px-5 py-6 text-sm leading-7 text-slate-300">
                <p className="font-semibold text-white">
                  Your chat replies will appear here.
                </p>
                <p className="mt-2">
                  Ask for a ticket summary, duplicate check, category help,
                  priority guidance, or a report suggestion.
                </p>
              </div>
            ) : (
              <div className="mt-5 max-h-[44rem] space-y-4 overflow-y-auto pr-1">
                {chatTurns.map((turn, index) => {
                  const isLatest = index === chatTurns.length - 1;
                  const snapshot = buildAssistantSnapshot(
                    turn.response.relatedTickets,
                  );

                  return (
                    <div key={turn.id} className="space-y-4">
                      <div className="flex justify-end">
                        <div className="max-w-[88%] rounded-[1.35rem] bg-[linear-gradient(135deg,rgba(15,118,110,1),rgba(14,116,144,0.96),rgba(67,56,202,0.96))] px-5 py-4 text-sm leading-7 text-white shadow-[0_16px_36px_rgba(14,116,144,0.18)]">
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/75">
                            You
                          </p>
                          <p className="mt-2">{turn.prompt}</p>
                        </div>
                      </div>

                      <div className="flex justify-start">
                        <div className="max-w-[92%] rounded-[1.45rem] border border-slate-700 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.94))] px-5 py-5 shadow-[0_16px_36px_rgba(2,6,23,0.28)]">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sky-300">
                                Smart Campus assistant
                              </p>
                              <p className="mt-2 text-lg font-semibold text-white">
                                {turn.response.title}
                              </p>
                            </div>
                            <span className="rounded-full border border-slate-700 bg-slate-900/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                              {toTicketTitleCase(turn.response.intent)}
                            </span>
                          </div>

                          {!turn.response.assistantEnabled ? (
                            <div className="mt-4 rounded-[1.15rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                              AI wording help is unavailable because
                              `Ticketing_API_KEY` is not configured, but
                              data-backed ticket answers still work.
                            </div>
                          ) : null}

                          {renderAssistantMessage(turn.response.message)}

                          {snapshot.length > 0 ? (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                              {snapshot.map((item) => (
                                <div
                                  key={item.label}
                                  className="rounded-[1.05rem] border border-slate-700 bg-slate-900/70 px-4 py-3 shadow-[0_10px_24px_rgba(2,6,23,0.18)]"
                                >
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    {item.label}
                                  </p>
                                  <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                                    {item.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : null}

                          {turn.response.recommendedCategoryName ||
                          turn.response.recommendedPriority ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {turn.response.recommendedCategoryName ? (
                                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-900">
                                  {turn.response.recommendedCategoryName}
                                </span>
                              ) : null}
                              {turn.response.recommendedPriority ? (
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-900">
                                  {toTicketTitleCase(
                                    turn.response.recommendedPriority,
                                  )}
                                </span>
                              ) : null}
                            </div>
                          ) : null}

                          {turn.response.highlights.length > 0 ? (
                            <div className="mt-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Key points
                              </p>
                              <div className="mt-3 grid gap-3">
                                {turn.response.highlights.map((item) => (
                                  <div
                                    key={item}
                                    className="flex gap-3 rounded-[1.1rem] border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm leading-6 text-slate-200"
                                  >
                                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {turn.response.suggestedActions.length > 0 ? (
                            <div className="mt-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Suggested next steps
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {turn.response.suggestedActions.map((item) => (
                                  <span
                                    key={item}
                                    className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200"
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {turn.response.reportSuggestionSummary ? (
                            <div className="mt-4 rounded-[1.2rem] border border-slate-700 bg-slate-900/70 px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Report suggestion
                              </p>
                              <p className="mt-2 text-sm leading-7 text-slate-200">
                                {turn.response.reportSuggestionSummary}
                              </p>
                            </div>
                          ) : null}

                          {turn.response.improvedDescription ? (
                            <div className="mt-4 rounded-[1.2rem] border border-slate-700 bg-slate-900/70 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  Improved description
                                </p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void onCopy(
                                      turn.response.improvedDescription,
                                      "Improved description",
                                    )
                                  }
                                  className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-400/60 hover:bg-slate-900"
                                >
                                  Copy
                                </button>
                              </div>
                              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-200">
                                {turn.response.improvedDescription}
                              </p>
                            </div>
                          ) : null}

                          {turn.response.suggestedComment ? (
                            <div className="mt-4 rounded-[1.2rem] border border-slate-700 bg-slate-900/70 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  Suggested comment
                                </p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void onCopy(
                                      turn.response.suggestedComment,
                                      "Suggested comment",
                                    )
                                  }
                                  className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-400/60 hover:bg-slate-900"
                                >
                                  Copy
                                </button>
                              </div>
                              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-200">
                                {turn.response.suggestedComment}
                              </p>
                            </div>
                          ) : null}

                          {turn.response.relatedTickets.length > 0 ? (
                            <div className="mt-4 rounded-[1.2rem] border border-slate-700 bg-slate-900/70 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  Related tickets
                                </p>
                                <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                                  {turn.response.relatedTickets.length} shown
                                </span>
                              </div>
                              <div className="mt-4 space-y-3">
                                {turn.response.relatedTickets.map((ticket) => (
                                  <button
                                    key={ticket.id}
                                    type="button"
                                    onClick={() =>
                                      void onSelectTicket?.(ticket.id)
                                    }
                                    className="flex w-full flex-col rounded-[1.1rem] border border-slate-700 bg-slate-950/80 p-4 text-left transition hover:border-sky-400/50 hover:bg-slate-900"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <span className="text-sm font-semibold text-white">
                                        {ticket.ticketNumber}
                                      </span>
                                      <div className="flex flex-wrap gap-2">
                                        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-900">
                                          {toTicketTitleCase(ticket.status)}
                                        </span>
                                        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                                          {toTicketTitleCase(ticket.priority)}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="mt-2 text-sm font-medium text-slate-100">
                                      {ticket.title}
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-slate-400">
                                      {[
                                        ticket.ticketCategoryName,
                                        ticket.locationName,
                                        ticket.resourceName,
                                      ]
                                        .filter(Boolean)
                                        .join(" | ")}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {isLatest && turn.response.reportSuggestion ? (
                            <div className="mt-4 flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  onApplyReportSuggestion(
                                    turn.response.reportSuggestion!,
                                    turn.prompt,
                                  )
                                }
                                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                              >
                                Use in report builder
                              </button>
                              <button
                                type="button"
                                disabled={generateBusy}
                                onClick={() =>
                                  onGenerateSuggestedReport(
                                    turn.response.reportSuggestion!,
                                  )
                                }
                                className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-60"
                              >
                                {generateBusy
                                  ? "Generating..."
                                  : "Generate suggested report"}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {pendingPrompt ? (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <div className="max-w-[88%] rounded-[1.35rem] bg-[linear-gradient(135deg,rgba(15,118,110,1),rgba(14,116,144,0.96),rgba(67,56,202,0.96))] px-5 py-4 text-sm leading-7 text-white shadow-[0_16px_36px_rgba(14,116,144,0.18)]">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/75">
                          You
                        </p>
                        <p className="mt-2">{pendingPrompt}</p>
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <div className="max-w-[70%] rounded-[1.35rem] border border-slate-700 bg-slate-900/85 px-5 py-4 shadow-[0_12px_28px_rgba(2,6,23,0.22)]">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sky-300">
                          Smart Campus assistant
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-sky-400 animate-pulse" />
                          <span className="h-2.5 w-2.5 rounded-full bg-sky-400 animate-pulse [animation-delay:120ms]" />
                          <span className="h-2.5 w-2.5 rounded-full bg-sky-400 animate-pulse [animation-delay:240ms]" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {followUpPrompts.length > 0 ? (
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Ask next
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {followUpPrompts.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => void onAsk(item.prompt)}
                    className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-400/60 hover:bg-slate-900"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div
            className={`mt-5 rounded-[1.45rem] border p-3 shadow-[0_14px_34px_rgba(15,23,42,0.05)] ${
              isConversationReady
                ? "border-sky-500/35 bg-slate-950/88 shadow-[0_16px_38px_rgba(2,6,23,0.34)]"
                : "border-slate-800 bg-slate-950/80"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1">
                <span className="sr-only">Chat with the ticket assistant</span>
                <input
                  value={assistantPrompt}
                  onFocus={() => setChatActivated(true)}
                  onChange={(e) => setAssistantPrompt(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void onAsk();
                    }
                  }}
                  placeholder={
                    selectedTicket
                      ? `Ask about ${selectedTicket.ticketNumber}, then press Enter...`
                      : "Ask anything about your tickets, reports, or next steps..."
                  }
                  className="w-full rounded-[1.1rem] border border-slate-700 bg-slate-900 px-4 py-4 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                />
              </label>
              <button
                type="button"
                disabled={assistantBusy}
                onClick={() => void onAsk()}
                className="rounded-full bg-[linear-gradient(135deg,rgba(15,118,110,1),rgba(14,116,144,0.96),rgba(67,56,202,0.96))] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
              >
                {assistantBusy ? "Thinking..." : "Send"}
              </button>
            </div>
            <p className="mt-3 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Press Enter to send. Follow-up questions stay in the same thread.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function TicketReportsPanel({
  currentUser,
  categories,
  locations,
  resources,
  staffUsers,
  reporterUsers,
  selectedTicket,
  initialReports,
  onSelectTicket,
}: Props) {
  const role = currentUser.role ?? "STUDENT";
  const showAssistant = role === "STUDENT";
  const chatStorageKey = `${CHAT_HISTORY_STORAGE_KEY}:${currentUser.id ?? currentUser.email ?? "anonymous"}`;
  const [form, setForm] = useState(() => initialForm(selectedTicket));
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [chatActivated, setChatActivated] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<AssistantChatSession[]>([]);
  const [hydratedChatStorageKey, setHydratedChatStorageKey] = useState<string | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [detailReportPreview, setDetailReportPreview] =
    useState<DetailReportPreview | null>(
      selectedTicket
        ? {
            ticketNumber: selectedTicket.ticketNumber,
            ticketTitle: selectedTicket.title,
          }
        : null,
    );
  const [latestReport, setLatestReport] = useState<TicketReportRecord | null>(
    initialReports[0] ?? null,
  );
  const [reports, setReports] = useState(initialReports);
  const [reportSearch, setReportSearch] = useState("");
  const [message, setMessage] = useState<{
    tone: "success" | "error" | "info";
    title?: string;
    text: string;
    details?: string[];
  } | null>(null);
  const [busy, setBusy] = useState<
    "generate" | "assistant" | `download-${number}` | null
  >(null);
  const activeChat =
    (activeChatId
      ? chatSessions.find((session) => session.id === activeChatId)
      : null) ?? null;
  const chatTurns = activeChat?.turns ?? [];
  const filteredReports = reports.filter((report) =>
    matchesReportSearch(report, reportSearch),
  );

  useEffect(() => {
    try {
      const savedHistory = window.localStorage.getItem(chatStorageKey);
      if (!savedHistory) {
        setChatSessions([]);
        setActiveChatId(null);
        setChatActivated(false);
        return;
      }

      const restored = normalizeStoredChatState(JSON.parse(savedHistory));
      setChatSessions(restored.sessions);
      setActiveChatId(restored.activeChatId);
      setChatActivated(restored.chatActivated);
    } catch {
      // Ignore unreadable saved chat history.
      setChatSessions([]);
      setActiveChatId(null);
      setChatActivated(false);
    } finally {
      setHydratedChatStorageKey(chatStorageKey);
    }
  }, [chatStorageKey]);

  useEffect(() => {
    if (hydratedChatStorageKey !== chatStorageKey) {
      return;
    }

    try {
      const sessions = chatSessions.slice(0, 12);
      window.localStorage.setItem(
        chatStorageKey,
        JSON.stringify({
          sessions,
          activeChatId: sessions.some((session) => session.id === activeChatId)
            ? activeChatId
            : null,
          chatActivated,
        } satisfies StoredAssistantChatState),
      );
    } catch {
      // Ignore storage write failures.
    }
  }, [activeChatId, chatActivated, chatSessions, chatStorageKey, hydratedChatStorageKey]);

  useEffect(() => {
    if (form.reportType !== "DETAIL") {
      setDetailReportPreview(null);
      return;
    }

    const ticketId = parseId(form.ticketId);
    const normalizedTicketNumber = normalizeTicketNumber(form.ticketNumber);

    if (
      selectedTicket &&
      ((ticketId != null && ticketId === selectedTicket.id) ||
        (normalizedTicketNumber != null &&
          normalizeTicketNumber(selectedTicket.ticketNumber) ===
            normalizedTicketNumber))
    ) {
      setDetailReportPreview({
        ticketNumber: selectedTicket.ticketNumber,
        ticketTitle: selectedTicket.title,
      });
      return;
    }

    if (ticketId == null && normalizedTicketNumber == null) {
      setDetailReportPreview(null);
      return;
    }

    let cancelled = false;

    async function resolveDetailReportPreview() {
      try {
        if (ticketId != null) {
          const detail = await getTicketDetailClient(ticketId);
          if (!cancelled) {
            setDetailReportPreview({
              ticketNumber: detail.ticketNumber,
              ticketTitle: detail.title,
            });
          }
          return;
        }

        const matches = await listTicketsClient({
          search: normalizedTicketNumber!,
        });
        const exactMatch =
          matches.find(
            (ticket) =>
              normalizeTicketNumber(ticket.ticketNumber) ===
              normalizedTicketNumber,
          ) ?? null;

        if (!cancelled) {
          setDetailReportPreview({
            ticketNumber: exactMatch?.ticketNumber ?? normalizedTicketNumber,
            ticketTitle: exactMatch?.title ?? null,
          });
        }
      } catch {
        if (!cancelled) {
          setDetailReportPreview({
            ticketNumber: normalizedTicketNumber,
            ticketTitle: null,
          });
        }
      }
    }

    void resolveDetailReportPreview();

    return () => {
      cancelled = true;
    };
  }, [form.reportType, form.ticketId, form.ticketNumber, selectedTicket]);

  const preview = [
    `${form.reportType === "DETAIL" ? "Detailed ticket report" : "Summary report"} in ${form.format}`,
    role === "ADMIN"
      ? "All tickets"
      : role === "STAFF"
        ? "Your reported and assigned tickets"
        : "Your own tickets",
    detailReportPreview?.ticketTitle
      ? `Title ${detailReportPreview.ticketTitle}`
      : null,
    detailReportPreview?.ticketNumber
      ? `Ticket ${detailReportPreview.ticketNumber}`
      : form.ticketNumber
        ? `Ticket ${form.ticketNumber.toUpperCase()}`
        : null,
    form.status ? `Status ${toTicketTitleCase(form.status)}` : null,
    form.priority ? `Priority ${toTicketTitleCase(form.priority)}` : null,
    form.ticketCategoryId
      ? (categories.find((item) => item.id === Number(form.ticketCategoryId))
          ?.name ?? null)
      : null,
    form.locationId
      ? locations.find((item) => item.id === Number(form.locationId))
        ? getLocationLabel(
            locations.find((item) => item.id === Number(form.locationId))!,
          )
        : null
      : null,
    form.resourceId
      ? resources.find((item) => item.id === Number(form.resourceId))
        ? getResourceLabel(
            resources.find((item) => item.id === Number(form.resourceId))!,
          )
        : null
      : null,
    form.startDate || form.endDate
      ? `Created ${form.startDate || "any time"} to ${form.endDate || "today"}`
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const quickPrompts = getQuickPrompts(role, selectedTicket);
  const welcomeCapabilities = [
    "Check ticket status and explain progress in simple words.",
    "Summarize ticket history, outcomes, and next steps.",
    "Suggest category, priority, and duplicate checks.",
    "Draft polite follow-up comments and prepare report downloads.",
  ];
  const latestReportTitle = latestReport
    ? getReportTitleLine(latestReport)
    : null;
  const latestReportTicketLine = latestReport
    ? getReportTicketLine(latestReport)
    : null;

  function applyReportSuggestion(
    request: GenerateTicketReportRequest,
    naturalLanguageRequest: string,
  ) {
    setForm(toFormStateFromRequest(request, naturalLanguageRequest));
  }

  async function handleGenerate(requestOverride?: GenerateTicketReportRequest) {
    setMessage(null);
    setBusy("generate");
    try {
      const request = requestOverride ?? toRequest(form);
      validate(request);
      const report = await generateTicketReportClient(request);
      setLatestReport(report);
      setReports((current) => [
        report,
        ...current.filter((item) => item.id !== report.id),
      ]);
      setMessage({
        tone: "success",
        title: "Report generated",
        text: `${report.fileName} is ready to download.`,
      });
    } catch (error) {
      setMessage({
        tone: "error",
        title: "Report could not be generated",
        text: getTicketErrorMessage(error, "Could not generate the report."),
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleAssistant(promptOverride?: string) {
    const prompt = (promptOverride ?? assistantPrompt).trim();
    if (!prompt) {
      setMessage({
        tone: "error",
        title: "Assistant request needed",
        text: "Enter a ticket assistant request first.",
      });
      return;
    }

    const sessionId = activeChatId ?? crypto.randomUUID();
    const currentSession =
      chatSessions.find((session) => session.id === sessionId) ?? null;
    const createdAt = currentSession?.createdAt ?? new Date().toISOString();
    const updatedAt = new Date().toISOString();
    const contextualPrompt = buildAssistantConversationPrompt(
      selectedTicket,
      chatTurns,
      prompt,
    );
    setChatActivated(true);
    setMessage(null);
    setBusy("assistant");
    setPendingPrompt(prompt);
    try {
      const response = await queryTicketAssistantClient({
        message: contextualPrompt,
        selectedTicketId: selectedTicket?.id,
      });
      const nextTurn = {
        id: crypto.randomUUID(),
        prompt,
        response,
      };
      setChatSessions((current) => {
        const existingSession =
          current.find((session) => session.id === sessionId) ?? null;
        const nextSession: AssistantChatSession = {
          id: sessionId,
          title:
            existingSession?.title ??
            buildChatSessionTitle(prompt, selectedTicket),
          turns: [...(existingSession?.turns ?? []), nextTurn],
          createdAt: existingSession?.createdAt ?? createdAt,
          updatedAt,
          ticketId: selectedTicket?.id ?? existingSession?.ticketId ?? null,
          ticketNumber:
            selectedTicket?.ticketNumber ??
            existingSession?.ticketNumber ??
            null,
          ticketTitle:
            selectedTicket?.title ?? existingSession?.ticketTitle ?? null,
        };
        return [
          nextSession,
          ...current.filter((session) => session.id !== sessionId),
        ];
      });
      setActiveChatId(sessionId);
      setAssistantPrompt("");
      setPendingPrompt(null);
      if (response.reportSuggestion) {
        applyReportSuggestion(response.reportSuggestion, prompt);
      }
    } catch (error) {
      setPendingPrompt(null);
      setMessage({
        tone: "error",
        title: "Assistant unavailable",
        text: getTicketErrorMessage(error, "Could not run the assistant."),
      });
    } finally {
      setBusy(null);
    }
  }

  function handleStartNewChat() {
    setActiveChatId(null);
    setPendingPrompt(null);
    setAssistantPrompt("");
    setChatActivated(true);
    setMessage(null);
  }

  function handleSelectChat(sessionId: string) {
    setActiveChatId(sessionId);
    setPendingPrompt(null);
    setAssistantPrompt("");
    setChatActivated(true);
    setMessage(null);
  }

  async function handleDownload(report: TicketReportRecord) {
    setMessage(null);
    setBusy(`download-${report.id}`);
    try {
      const download = await downloadTicketReportClient(report.id);
      saveBlob(download.blob, download.fileName);
      setMessage({
        tone: "success",
        title: "Download ready",
        text: `${download.fileName} downloaded successfully.`,
      });
    } catch (error) {
      setMessage({
        tone: "error",
        title: "Download failed",
        text: getTicketErrorMessage(error, "Could not download the report."),
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleCopy(text: string | null, label: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setMessage({
        tone: "success",
        title: "Copied",
        text: `${label} copied to clipboard.`,
      });
    } catch {
      setMessage({
        tone: "error",
        title: "Copy failed",
        text: `Could not copy the ${label.toLowerCase()}.`,
      });
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.10),_transparent_38%),rgba(255,255,255,0.92)] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {showAssistant ? "Assistant and reports" : "Reports and downloads"}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {showAssistant
              ? "Ask, understand, and download from one ticket hub"
              : "Build and download PDF ticket reports"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {showAssistant
              ? "Use the ticket assistant for status checks, history summaries, FAQ help, duplicate detection, category and priority guidance, comment drafting, reminders, insights, and report downloads. The manual report builder stays here for exact control."
              : "Use the manual builder to prepare PDF ticket reports and download recent exports from your own report history."}
          </p>
        </div>
        <div className="rounded-full border border-white/80 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700">
          {role === "ADMIN"
            ? "Admin report workspace"
            : role === "STAFF"
              ? "Staff report workspace"
              : "Student self-service assistant"}
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <div className="space-y-6">
          {showAssistant ? (
            <StudentAssistantChatPanel
              selectedTicket={selectedTicket}
              quickPrompts={quickPrompts}
              welcomeCapabilities={welcomeCapabilities}
              assistantPrompt={assistantPrompt}
              setAssistantPrompt={setAssistantPrompt}
              chatActivated={chatActivated}
              setChatActivated={setChatActivated}
              chatSessions={chatSessions}
              activeChatId={activeChatId}
              chatTurns={chatTurns}
              pendingPrompt={pendingPrompt}
              assistantBusy={busy === "assistant"}
              generateBusy={busy === "generate"}
              onAsk={(promptOverride) => {
                void handleAssistant(promptOverride);
              }}
              onSelectChat={handleSelectChat}
              onStartNewChat={handleStartNewChat}
              onApplyReportSuggestion={applyReportSuggestion}
              onGenerateSuggestedReport={(request) => {
                void handleGenerate(request);
              }}
              onCopy={(text, label) => {
                void handleCopy(text, label);
              }}
              onSelectTicket={onSelectTicket}
            />
          ) : null}

          <article className="rounded-[1.7rem] border border-white/80 bg-white/92 p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Manual builder
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                  Configure the export exactly
                </h3>
              </div>
              {selectedTicket ? (
                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      reportType: "DETAIL",
                      ticketId: String(selectedTicket.id),
                      ticketNumber: selectedTicket.ticketNumber,
                    }))
                  }
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Use selected ticket
                </button>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className={LABEL}>Report type</span>
                <select
                  value={form.reportType}
                  onChange={(e) =>
                    setForm((current) => {
                      const nextReportType = e.target.value as TicketReportType;

                      if (nextReportType === "SUMMARY") {
                        return {
                          ...current,
                          reportType: nextReportType,
                          ticketId: "",
                          ticketNumber: "",
                        };
                      }

                      return {
                        ...current,
                        reportType: nextReportType,
                        ticketId:
                          current.ticketId ||
                          (selectedTicket ? String(selectedTicket.id) : ""),
                        ticketNumber:
                          current.ticketNumber || selectedTicket?.ticketNumber || "",
                      };
                    })
                  }
                  className={INPUT}
                >
                  <option value="SUMMARY">Summary</option>
                  <option value="DETAIL">Detail</option>
                </select>
              </label>
              <div className="space-y-2">
                <span className={LABEL}>Format</span>
                <div className="flex min-h-[50px] items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  PDF only
                </div>
              </div>

              {form.reportType === "DETAIL" ? (
                <>
                  <label className="space-y-2">
                    <span className={LABEL}>Ticket number</span>
                    <input
                      value={form.ticketNumber}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          ticketNumber: e.target.value,
                        }))
                      }
                      placeholder="TCK-20260418-AB12CD"
                      className={INPUT}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className={LABEL}>Ticket ID</span>
                    <input
                      value={form.ticketId}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          ticketId: e.target.value,
                        }))
                      }
                      placeholder="Optional numeric ID"
                      className={INPUT}
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="space-y-2">
                    <span className={LABEL}>Status</span>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          status: e.target.value as TicketStatus | "",
                        }))
                      }
                      className={INPUT}
                    >
                      <option value="">All statuses</option>
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {toTicketTitleCase(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className={LABEL}>Priority</span>
                    <select
                      value={form.priority}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          priority: e.target.value as TicketPriority | "",
                        }))
                      }
                      className={INPUT}
                    >
                      <option value="">All priorities</option>
                      {PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {toTicketTitleCase(priority)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className={LABEL}>Category</span>
                    <select
                      value={form.ticketCategoryId}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          ticketCategoryId: e.target.value,
                        }))
                      }
                      className={INPUT}
                    >
                      <option value="">All categories</option>
                      {categories
                        .filter((item) => item.isActive)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className={LABEL}>Location</span>
                    <select
                      value={form.locationId}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          locationId: e.target.value,
                        }))
                      }
                      className={INPUT}
                    >
                      <option value="">All locations</option>
                      {locations.map((item) => (
                        <option key={item.id} value={item.id}>
                          {getLocationLabel(item)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className={LABEL}>Resource</span>
                    <select
                      value={form.resourceId}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          resourceId: e.target.value,
                        }))
                      }
                      className={INPUT}
                    >
                      <option value="">All resources</option>
                      {resources
                        .filter((item) =>
                          form.locationId
                            ? item.locationId === Number(form.locationId)
                            : true,
                        )
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {getResourceLabel(item)}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className={LABEL}>Start date</span>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          startDate: e.target.value,
                        }))
                      }
                      className={INPUT}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className={LABEL}>End date</span>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          endDate: e.target.value,
                        }))
                      }
                      className={INPUT}
                    />
                  </label>
                  {role === "ADMIN" ? (
                    <label className="space-y-2">
                      <span className={LABEL}>Assigned staff</span>
                      <select
                        value={form.assignedStaffUserId}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            assignedStaffUserId: e.target.value,
                          }))
                        }
                        className={INPUT}
                      >
                        <option value="">Any staff owner</option>
                        {staffUsers.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.displayName}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {role === "ADMIN" ? (
                    <label className="space-y-2">
                      <span className={LABEL}>User name</span>
                      <select
                        value={form.reporterUserId}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            reporterUserId: e.target.value,
                          }))
                        }
                        className={INPUT}
                      >
                        <option value="">All users</option>
                        {reporterUsers.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.displayName}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </>
              )}
            </div>

            <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
              {preview}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy === "generate"}
                onClick={() => void handleGenerate()}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {busy === "generate" ? "Generating..." : "Generate report"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(initialForm(selectedTicket));
                  setMessage(null);
                }}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Reset
              </button>
            </div>

            <div className="mt-8 border-t border-slate-200/80 pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Download report
              </p>
              <h4 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                Latest generated file
              </h4>
              {latestReport ? (
                <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  {latestReportTitle ? (
                    <p className="text-lg font-semibold text-slate-950">
                      {latestReportTitle}
                    </p>
                  ) : null}
                  {latestReportTicketLine ? (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {latestReportTicketLine}
                    </p>
                  ) : null}
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    {latestReport.fileName}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {latestReport.summaryText ??
                      latestReport.filterSummary ??
                      "Report generated successfully."}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {latestReport.format} |{" "}
                    {toTicketTitleCase(latestReport.reportType)} |{" "}
                    {latestReport.recordCount} record
                    {latestReport.recordCount === 1 ? "" : "s"} |{" "}
                    {formatDateTime(latestReport.generatedAt)}
                  </p>
                  <button
                    type="button"
                    disabled={busy === `download-${latestReport.id}`}
                    onClick={() => void handleDownload(latestReport)}
                    className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {busy === `download-${latestReport.id}`
                      ? "Preparing..."
                      : "Download report"}
                  </button>
                </div>
              ) : (
                <p className="mt-5 rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
                  Generate a report to preview the file here before downloading
                  it.
                </p>
              )}
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-[1.7rem] border border-white/80 bg-white/92 p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Report history
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                  Recent exports
                </h3>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                {filteredReports.length} shown
                {filteredReports.length !== reports.length
                  ? ` / ${reports.length}`
                  : ""}
              </span>
            </div>
            <div className="mt-5">
              <label className="space-y-2">
                <span className={LABEL}>Filter saved reports</span>
                <input
                  value={reportSearch}
                  onChange={(event) => setReportSearch(event.target.value)}
                  placeholder={
                    role === "ADMIN"
                      ? "User name, ticket title, ticket number, or file"
                      : "Ticket title, ticket number, or file"
                  }
                  className={INPUT}
                />
              </label>
            </div>
            <div className="mt-5 space-y-3">
              {filteredReports.length === 0 ? (
                <p className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
                  {reports.length === 0
                    ? "No reports generated yet."
                    : "No saved reports match the current filter."}
                </p>
              ) : (
                filteredReports.slice(0, 8).map((report) => (
                  <div
                    key={report.id}
                    className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        {getReportTitleLine(report) ? (
                          <p className="text-base font-semibold text-slate-950">
                            {getReportTitleLine(report)}
                          </p>
                        ) : null}
                        {getReportTicketLine(report) ? (
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {getReportTicketLine(report)}
                          </p>
                        ) : null}
                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          {report.fileName}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                          {toTicketTitleCase(report.reportType)} |{" "}
                          {report.format} | {formatDateTime(report.generatedAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy === `download-${report.id}`}
                        onClick={() => void handleDownload(report)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {busy === `download-${report.id}`
                          ? "Preparing..."
                          : "Download"}
                      </button>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {report.summaryText ??
                        report.filterSummary ??
                        "Ticket report ready."}
                    </p>
                    {role === "ADMIN" ? (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                        Generated by {report.generatedByDisplayName}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </article>
        </div>
      </div>

      <TicketPopupNotice
        notice={
          message
            ? {
                tone: message.tone,
                title: message.title,
                message: message.text,
                details: message.details,
              }
            : null
        }
        onClose={() => setMessage(null)}
        actionLabel={message?.tone === "success" ? "Close" : "Review"}
      />
    </section>
  );
}
