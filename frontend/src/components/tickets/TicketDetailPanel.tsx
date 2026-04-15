"use client";

import {
  canCurrentUserUpdateStatus,
  formatDateTime,
  toTicketTitleCase,
} from "@/lib/tickets/shared";
import type {
  CreateTicketAttachmentRequest,
  CreateTicketCommentRequest,
  TicketBundle,
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
  onOpenAssignment: () => void;
  onOpenStatus: () => void;
  onCreateComment: (payload: CreateTicketCommentRequest) => Promise<void>;
  onCreateAttachment: (payload: CreateTicketAttachmentRequest) => Promise<void>;
  onDeleteAttachment: (attachmentId: number) => Promise<void>;
};

export function TicketDetailPanel({
  currentUser,
  ticketBundle,
  detailLoading = false,
  busy = false,
  onOpenAssignment,
  onOpenStatus,
  onCreateComment,
  onCreateAttachment,
  onDeleteAttachment,
}: TicketDetailPanelProps) {
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
          The detail area shows incident context, staff ownership, workflow history, comments, and
          attachment metadata once you choose a ticket from the queue.
        </p>
      </section>
    );
  }

  const { detail, comments, attachments } = ticketBundle;
  const canAssign = currentUser.role === "ADMIN";
  const canUpdate =
    currentUser.role != null &&
    currentUser.id != null &&
    canCurrentUserUpdateStatus(currentUser.role, currentUser.id, detail);

  return (
    <section className="space-y-6">
      <section className="rounded-[1.75rem] border border-white/70 bg-white/85 p-8 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {detail.ticketNumber}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              {detail.title}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              {detail.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <TicketStatusBadge status={detail.status} />
            <TicketPriorityBadge priority={detail.priority} />
          </div>
        </div>

        {detailLoading ? (
          <p className="mt-5 rounded-[1.1rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Refreshing ticket details...
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {canAssign ? (
            <button
              type="button"
              onClick={onOpenAssignment}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Assign or reassign staff
            </button>
          ) : null}
          {canUpdate ? (
            <button
              type="button"
              onClick={onOpenStatus}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Update status
            </button>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[1.5rem] border border-white/70 bg-white/85 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Issue context
          </p>
          <dl className="mt-5 grid gap-4 text-sm leading-7 text-slate-600">
            <div>
              <dt className="font-semibold text-slate-900">Category</dt>
              <dd>{detail.ticketCategoryName}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Resource</dt>
              <dd>{detail.resourceName ? `${detail.resourceName} (${detail.resourceCode})` : "No specific resource"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Location</dt>
              <dd>{detail.locationName || "Not provided"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Created</dt>
              <dd>{formatDateTime(detail.createdAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Last updated</dt>
              <dd>{formatDateTime(detail.updatedAt)}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-[1.5rem] border border-white/70 bg-white/85 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            People and contact
          </p>
          <dl className="mt-5 grid gap-4 text-sm leading-7 text-slate-600">
            <div>
              <dt className="font-semibold text-slate-900">Reporter</dt>
              <dd>{detail.reporterDisplayName}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Reporter email</dt>
              <dd>{detail.reporterEmail}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Assigned staff</dt>
              <dd>{detail.assignedStaffDisplayName ?? "Not assigned yet"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Preferred contact name</dt>
              <dd>{detail.preferredContactName || "Not provided"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Preferred contact email</dt>
              <dd>{detail.preferredContactEmail || "Not provided"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Preferred contact phone</dt>
              <dd>{detail.preferredContactPhone || "Not provided"}</dd>
            </div>
          </dl>
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
                  <p className="mt-2 text-sm leading-7 text-slate-700">{assignment.assignmentNote}</p>
                ) : null}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-white/70 bg-white/85 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Lifecycle
          </p>
          <dl className="mt-5 grid gap-4 text-sm leading-7 text-slate-600">
            <div>
              <dt className="font-semibold text-slate-900">Current status</dt>
              <dd>{toTicketTitleCase(detail.status)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Resolution summary</dt>
              <dd>{detail.resolutionSummary || "Not captured yet"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Rejection reason</dt>
              <dd>{detail.rejectionReason || "Not rejected"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Resolved at</dt>
              <dd>{formatDateTime(detail.resolvedAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Closed at</dt>
              <dd>{formatDateTime(detail.closedAt)}</dd>
            </div>
          </dl>
        </article>
      </div>

      <TicketComments
        key={`comments-${detail.id}`}
        currentUser={currentUser}
        ticket={detail}
        comments={comments}
        busy={busy}
        onSubmit={onCreateComment}
      />

      <TicketAttachmentPanel
        key={`attachments-${detail.id}`}
        currentUser={currentUser}
        ticket={detail}
        attachments={attachments}
        busy={busy}
        onCreate={onCreateAttachment}
        onDelete={onDeleteAttachment}
      />
    </section>
  );
}
