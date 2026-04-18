"use client";

import type { RoleCode } from "@/types/auth";

import {
  describeTicketScope,
  formatDateTime,
  getTicketProgressLabel,
} from "@/lib/tickets/shared";
import type { TicketSummary } from "@/lib/tickets/types";
import { TicketPriorityBadge } from "@/components/tickets/TicketPriorityBadge";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";

type TicketListProps = {
  role: RoleCode;
  currentUserId: number | null;
  tickets: TicketSummary[];
  totalTickets: number;
  activeViewLabel: string;
  emptyStateMessage: string;
  selectedTicketId: number | null;
  busy?: boolean;
  onSelect: (ticketId: number) => void;
};

function TicketSupplementalText(role: RoleCode, currentUserId: number | null, ticket: TicketSummary) {
  switch (role) {
    case "ADMIN":
      return (
        <div className="space-y-1 text-sm text-slate-600">
          <p>Reporter: {ticket.reporterDisplayName}</p>
          <p>Assignee: {ticket.assignedStaffDisplayName ?? "Not assigned"}</p>
        </div>
      );
    case "STAFF":
      return (
        <div className="space-y-1 text-sm text-slate-600">
          {ticket.assignedStaffUserId === currentUserId ? (
            <>
              <p>Reporter: {ticket.reporterDisplayName}</p>
              <p>Assigned to you for action</p>
            </>
          ) : (
            <>
              <p>Reported by you</p>
              <p>Assignee: {ticket.assignedStaffDisplayName ?? "Not assigned"}</p>
            </>
          )}
        </div>
      );
    case "STUDENT":
      return (
        <div className="space-y-1 text-sm text-slate-600">
          <p>Handled by: {ticket.assignedStaffDisplayName ?? "Awaiting assignment"}</p>
          <p>Track comments and status changes below.</p>
        </div>
      );
  }
}

export function TicketList({
  role,
  currentUserId,
  tickets,
  totalTickets,
  activeViewLabel,
  emptyStateMessage,
  selectedTicketId,
  busy = false,
  onSelect,
}: TicketListProps) {
  return (
    <section className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Ticket queue
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
            {describeTicketScope(role)}
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            {busy
              ? "Refreshing tickets from the backend..."
              : `${tickets.length} ticket(s) shown in ${activeViewLabel}.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
              {activeViewLabel}
            </span>
            {tickets.length !== totalTickets ? (
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 ring-1 ring-inset ring-slate-200">
                {totalTickets} total in workspace
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {tickets.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm leading-7 text-slate-600">
            {emptyStateMessage}
          </div>
        ) : null}

        {tickets.map((ticket) => {
          const selected = ticket.id === selectedTicketId;

          return (
            <button
              key={ticket.id}
              type="button"
              onClick={() => onSelect(ticket.id)}
              className={`w-full rounded-[1.4rem] border px-4 py-4 text-left transition ${
                selected
                  ? "border-teal-400 bg-teal-50/80 shadow-[0_16px_35px_rgba(15,118,110,0.12)]"
                  : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div className="flex flex-wrap gap-2">
                <TicketStatusBadge status={ticket.status} />
                <TicketPriorityBadge priority={ticket.priority} />
              </div>

              <div className="mt-4 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {ticket.ticketNumber}
                </p>
                <h3 className="text-base font-semibold text-slate-950">{ticket.title}</h3>
                <p className="text-sm text-slate-600">{ticket.ticketCategoryName}</p>
              </div>

              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <p>
                  {ticket.resourceName
                    ? `${ticket.resourceName}${ticket.locationName ? ` / ${ticket.locationName}` : ""}`
                    : ticket.locationName || "Location pending"}
                </p>
                <p>Raised {formatDateTime(ticket.createdAt)}</p>
                <p>{getTicketProgressLabel(ticket)}</p>
              </div>

              <div className="mt-4">{TicketSupplementalText(role, currentUserId, ticket)}</div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  Staff reviews {ticket.staffReviewCount}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  Admin reviews {ticket.adminReviewCount}
                </span>
                {ticket.reconsiderationRequestCount > 0 ? (
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">
                    Reconsideration {ticket.reconsiderationRequestCount}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
