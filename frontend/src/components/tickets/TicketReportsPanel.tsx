"use client";

import { useState } from "react";

import {
  downloadTicketReportClient,
  generateTicketReportClient,
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
const LABEL = "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500";
const STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"];
const PRIORITIES: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

type AssistantBlock =
  | { type: "paragraph"; lines: string[] }
  | { type: "list"; items: string[] };

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

function toRequest(form: FormState): GenerateTicketReportRequest {
  const request: GenerateTicketReportRequest = {
    reportType: form.reportType,
    format: form.format,
  };
  if (parseId(form.ticketId) != null) request.ticketId = parseId(form.ticketId);
  if (form.ticketNumber.trim()) request.ticketNumber = form.ticketNumber.trim();
  if (form.status) request.status = form.status;
  if (form.priority) request.priority = form.priority;
  if (parseId(form.ticketCategoryId) != null) request.ticketCategoryId = parseId(form.ticketCategoryId);
  if (parseId(form.locationId) != null) request.locationId = parseId(form.locationId);
  if (parseId(form.resourceId) != null) request.resourceId = parseId(form.resourceId);
  if (parseId(form.assignedStaffUserId) != null) {
    request.assignedStaffUserId = parseId(form.assignedStaffUserId);
  }
  if (parseId(form.reporterUserId) != null) request.reporterUserId = parseId(form.reporterUserId);
  if (form.startDate) request.startDate = form.startDate;
  if (form.endDate) request.endDate = form.endDate;
  if (form.naturalLanguageRequest.trim()) {
    request.naturalLanguageRequest = form.naturalLanguageRequest.trim();
  }
  return request;
}

function validate(request: GenerateTicketReportRequest) {
  if (request.reportType === "DETAIL" && request.ticketId == null && !request.ticketNumber?.trim()) {
    throw new Error("Choose a ticket or enter a ticket number for the detailed report.");
  }
  if (request.startDate && request.endDate && request.startDate > request.endDate) {
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
    ticketCategoryId: request.ticketCategoryId != null ? String(request.ticketCategoryId) : "",
    locationId: request.locationId != null ? String(request.locationId) : "",
    resourceId: request.resourceId != null ? String(request.resourceId) : "",
    assignedStaffUserId:
      request.assignedStaffUserId != null ? String(request.assignedStaffUserId) : "",
    reporterUserId: request.reporterUserId != null ? String(request.reporterUserId) : "",
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
  return value.replace(/^[-*•]\s+/, "").replace(/^\d+\.\s+/, "").trim();
}

function parseAssistantBlocks(text: string | null | undefined): AssistantBlock[] {
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
      const isList = lines.length > 1 && lines.every((line) => /^[-*•]\s+|^\d+\.\s+/.test(line));

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

function buildAssistantSnapshot(tickets: TicketAssistantResponse["relatedTickets"]) {
  if (tickets.length === 0) {
    return [];
  }

  return [
    { label: "Tickets", value: String(tickets.length) },
    { label: "Open", value: String(tickets.filter((ticket) => ticket.status === "OPEN").length) },
    {
      label: "In progress",
      value: String(tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length),
    },
    {
      label: "Resolved",
      value: String(tickets.filter((ticket) => ticket.status === "RESOLVED").length),
    },
  ];
}

function renderAssistantMessage(text: string) {
  const blocks = parseAssistantBlocks(text);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
      {blocks.map((block, index) =>
        block.type === "list" ? (
          <ul key={`list-${index}`} className="space-y-2 rounded-[1.1rem] bg-white/70 px-4 py-3">
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

function getQuickPrompts(role: NonNullable<CurrentUser["role"]>, selectedTicket: TicketDetail | null) {
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
  const [form, setForm] = useState(() => initialForm(selectedTicket));
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [assistantResult, setAssistantResult] = useState<TicketAssistantResponse | null>(null);
  const [latestReport, setLatestReport] = useState<TicketReportRecord | null>(initialReports[0] ?? null);
  const [reports, setReports] = useState(initialReports);
  const [message, setMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(
    null,
  );
  const [busy, setBusy] = useState<"generate" | "assistant" | `download-${number}` | null>(null);

  const preview = [
    `${form.reportType === "DETAIL" ? "Detailed ticket report" : "Summary report"} in ${form.format}`,
    role === "ADMIN"
      ? "All tickets"
      : role === "STAFF"
        ? "Your reported and assigned tickets"
        : "Your own tickets",
    form.ticketNumber ? `Ticket ${form.ticketNumber.toUpperCase()}` : null,
    form.status ? `Status ${toTicketTitleCase(form.status)}` : null,
    form.priority ? `Priority ${toTicketTitleCase(form.priority)}` : null,
    form.ticketCategoryId
      ? categories.find((item) => item.id === Number(form.ticketCategoryId))?.name ?? null
      : null,
    form.locationId
      ? locations.find((item) => item.id === Number(form.locationId))
        ? getLocationLabel(locations.find((item) => item.id === Number(form.locationId))!)
        : null
      : null,
    form.resourceId
      ? resources.find((item) => item.id === Number(form.resourceId))
        ? getResourceLabel(resources.find((item) => item.id === Number(form.resourceId))!)
        : null
      : null,
    form.startDate || form.endDate
      ? `Created ${form.startDate || "any time"} to ${form.endDate || "today"}`
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const quickPrompts = getQuickPrompts(role, selectedTicket);
  const assistantSnapshot = assistantResult ? buildAssistantSnapshot(assistantResult.relatedTickets) : [];

  function applyReportSuggestion(request: GenerateTicketReportRequest, naturalLanguageRequest: string) {
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
      setReports((current) => [report, ...current.filter((item) => item.id !== report.id)]);
      setMessage({ tone: "success", text: `${report.fileName} is ready to download.` });
    } catch (error) {
      setMessage({ tone: "error", text: getTicketErrorMessage(error, "Could not generate the report.") });
    } finally {
      setBusy(null);
    }
  }

  async function handleAssistant(promptOverride?: string) {
    const prompt = (promptOverride ?? assistantPrompt).trim();
    if (!prompt) {
      setMessage({ tone: "error", text: "Enter a ticket assistant request first." });
      return;
    }

    setAssistantPrompt(prompt);
    setMessage(null);
    setBusy("assistant");
    try {
      const response = await queryTicketAssistantClient({
        message: prompt,
        selectedTicketId: selectedTicket?.id,
      });
      setAssistantResult(response);
      if (response.reportSuggestion) {
        applyReportSuggestion(response.reportSuggestion, prompt);
      }
      setMessage({
        tone: response.reportSuggestion ? "success" : "info",
        text: response.message,
      });
    } catch (error) {
      setMessage({ tone: "error", text: getTicketErrorMessage(error, "Could not run the assistant.") });
    } finally {
      setBusy(null);
    }
  }

  async function handleDownload(report: TicketReportRecord) {
    setMessage(null);
    setBusy(`download-${report.id}`);
    try {
      const download = await downloadTicketReportClient(report.id);
      saveBlob(download.blob, download.fileName);
      setMessage({ tone: "success", text: `${download.fileName} downloaded successfully.` });
    } catch (error) {
      setMessage({ tone: "error", text: getTicketErrorMessage(error, "Could not download the report.") });
    } finally {
      setBusy(null);
    }
  }

  async function handleCopy(text: string | null, label: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ tone: "success", text: `${label} copied to clipboard.` });
    } catch {
      setMessage({ tone: "error", text: `Could not copy the ${label.toLowerCase()}.` });
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
              : "Use the manual builder to prepare PDF ticket reports and download recent exports for your ticket scope."}
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

      {message ? (
        <p
          className={`mt-6 rounded-[1.3rem] border px-4 py-3 text-sm ${
            message.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : message.tone === "info"
                ? "border-sky-200 bg-sky-50 text-sky-800"
                : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <div className="space-y-6">
          {showAssistant ? (
            <article className="rounded-[1.7rem] border border-white/80 bg-white/92 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Smart chatbot
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                  Ask about tickets in plain language
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  The assistant answers from your live ticket scope. It can also refine wording
                  with the configured AI model when needed.
                </p>
              </div>
              {selectedTicket ? (
                <div className="rounded-[1.2rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                  <p className="font-semibold">Selected ticket</p>
                  <p className="mt-1">{selectedTicket.ticketNumber}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {quickPrompts.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => void handleAssistant(item.prompt)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <textarea
              value={assistantPrompt}
              onChange={(e) => setAssistantPrompt(e.target.value)}
              rows={5}
              placeholder={
                selectedTicket
                  ? `Example: Summarize the history of ticket ${selectedTicket.ticketNumber}.`
                  : "Example: Recommend a category and priority for this issue: Wi-Fi is down in Lab 2."
              }
              className={`${INPUT} mt-5 min-h-32 resize-y`}
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy === "assistant"}
                onClick={() => void handleAssistant()}
                className="rounded-full border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-900 transition hover:border-sky-300 hover:bg-sky-100 disabled:opacity-60"
              >
                {busy === "assistant" ? "Thinking..." : "Ask assistant"}
              </button>
              {assistantResult?.reportSuggestion ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      applyReportSuggestion(assistantResult.reportSuggestion!, assistantPrompt.trim())
                    }
                    className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Use in report builder
                  </button>
                  <button
                    type="button"
                    disabled={busy === "generate"}
                    onClick={() => void handleGenerate(assistantResult.reportSuggestion!)}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-60"
                  >
                    {busy === "generate" ? "Generating..." : "Generate suggested report"}
                  </button>
                </>
              ) : null}
            </div>

            {assistantResult ? (
              <div className="mt-5 space-y-4">
                {!assistantResult.assistantEnabled ? (
                  <div className="rounded-[1.3rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    AI wording help is unavailable because `Ticketing_API_KEY` is not configured, but
                    data-backed ticket answers still work.
                  </div>
                ) : null}

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">{assistantResult.title}</p>
                      {renderAssistantMessage(assistantResult.message)}
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                      {toTicketTitleCase(assistantResult.intent)}
                    </span>
                  </div>

                  {assistantSnapshot.length > 0 ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {assistantSnapshot.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-[1.1rem] border border-white/80 bg-white/90 px-4 py-3"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {item.label}
                          </p>
                          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {assistantResult.recommendedCategoryName || assistantResult.recommendedPriority ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {assistantResult.recommendedCategoryName ? (
                        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-900">
                          {assistantResult.recommendedCategoryName}
                        </span>
                      ) : null}
                      {assistantResult.recommendedPriority ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-900">
                          {toTicketTitleCase(assistantResult.recommendedPriority)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {assistantResult.highlights.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Key points
                      </p>
                      <div className="mt-3 grid gap-3">
                        {assistantResult.highlights.map((item) => (
                          <div
                            key={item}
                            className="flex gap-3 rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700"
                          >
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {assistantResult.suggestedActions.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Suggested next steps
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {assistantResult.suggestedActions.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {assistantResult.reportSuggestionSummary ? (
                    <div className="mt-4 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Report suggestion
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">
                        {assistantResult.reportSuggestionSummary}
                      </p>
                    </div>
                  ) : null}
                </div>

                {assistantResult.improvedDescription ? (
                  <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Improved description
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopy(assistantResult.improvedDescription, "Improved description")
                        }
                        className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                      {assistantResult.improvedDescription}
                    </p>
                  </div>
                ) : null}

                {assistantResult.suggestedComment ? (
                  <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Suggested comment
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopy(assistantResult.suggestedComment, "Suggested comment")
                        }
                        className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                      {assistantResult.suggestedComment}
                    </p>
                  </div>
                ) : null}

                {assistantResult.relatedTickets.length > 0 ? (
                  <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Related tickets
                      </p>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                        {assistantResult.relatedTickets.length} shown
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {assistantResult.relatedTickets.map((ticket) => (
                        <button
                          key={ticket.id}
                          type="button"
                          onClick={() => void onSelectTicket?.(ticket.id)}
                          className="flex w-full flex-col rounded-[1.1rem] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-slate-950">
                              {ticket.ticketNumber}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-900">
                                {toTicketTitleCase(ticket.status)}
                              </span>
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                                {toTicketTitleCase(ticket.priority)}
                              </span>
                            </div>
                          </div>
                          <p className="mt-2 text-sm font-medium text-slate-900">{ticket.title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {[ticket.ticketCategoryName, ticket.locationName, ticket.resourceName]
                              .filter(Boolean)
                              .join(" | ")}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            </article>
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
                    setForm((current) => ({ ...current, reportType: e.target.value as TicketReportType }))
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
                      onChange={(e) => setForm((current) => ({ ...current, ticketNumber: e.target.value }))}
                      placeholder="TCK-20260418-AB12CD"
                      className={INPUT}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className={LABEL}>Ticket ID</span>
                    <input
                      value={form.ticketId}
                      onChange={(e) => setForm((current) => ({ ...current, ticketId: e.target.value }))}
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
                        setForm((current) => ({ ...current, status: e.target.value as TicketStatus | "" }))
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
                        setForm((current) => ({ ...current, ticketCategoryId: e.target.value }))
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
                      onChange={(e) => setForm((current) => ({ ...current, locationId: e.target.value }))}
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
                      onChange={(e) => setForm((current) => ({ ...current, resourceId: e.target.value }))}
                      className={INPUT}
                    >
                      <option value="">All resources</option>
                      {resources
                        .filter((item) => (form.locationId ? item.locationId === Number(form.locationId) : true))
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
                      onChange={(e) => setForm((current) => ({ ...current, startDate: e.target.value }))}
                      className={INPUT}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className={LABEL}>End date</span>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((current) => ({ ...current, endDate: e.target.value }))}
                      className={INPUT}
                    />
                  </label>
                  {role === "ADMIN" ? (
                    <label className="space-y-2">
                      <span className={LABEL}>Assigned staff</span>
                      <select
                        value={form.assignedStaffUserId}
                        onChange={(e) =>
                          setForm((current) => ({ ...current, assignedStaffUserId: e.target.value }))
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
                      <span className={LABEL}>Reporter</span>
                      <select
                        value={form.reporterUserId}
                        onChange={(e) =>
                          setForm((current) => ({ ...current, reporterUserId: e.target.value }))
                        }
                        className={INPUT}
                      >
                        <option value="">Any reporter</option>
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
                  setAssistantResult(null);
                  setMessage(null);
                }}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-[1.7rem] border border-white/80 bg-white/92 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Ready to download
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Latest generated file
            </h3>
            {latestReport ? (
              <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-lg font-semibold text-slate-950">{latestReport.fileName}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {latestReport.summaryText ?? latestReport.filterSummary ?? "Report generated successfully."}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {latestReport.format} | {toTicketTitleCase(latestReport.reportType)} |{" "}
                  {latestReport.recordCount} record{latestReport.recordCount === 1 ? "" : "s"} |{" "}
                  {formatDateTime(latestReport.generatedAt)}
                </p>
                <button
                  type="button"
                  disabled={busy === `download-${latestReport.id}`}
                  onClick={() => void handleDownload(latestReport)}
                  className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {busy === `download-${latestReport.id}` ? "Preparing..." : "Download report"}
                </button>
              </div>
            ) : (
              <p className="mt-5 rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
                Generate a report to preview the file here before downloading it.
              </p>
            )}
          </article>

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
                {reports.length} saved
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {reports.length === 0 ? (
                <p className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
                  No reports generated yet.
                </p>
              ) : (
                reports.slice(0, 8).map((report) => (
                  <div key={report.id} className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{report.fileName}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                          {toTicketTitleCase(report.reportType)} | {report.format} |{" "}
                          {formatDateTime(report.generatedAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy === `download-${report.id}`}
                        onClick={() => void handleDownload(report)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {busy === `download-${report.id}` ? "Preparing..." : "Download"}
                      </button>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {report.summaryText ?? report.filterSummary ?? "Ticket report ready."}
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
    </section>
  );
}
