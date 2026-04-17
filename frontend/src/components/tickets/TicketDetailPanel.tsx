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
  getTicketProgressLabel,
  toTicketTitleCase,
} from "@/lib/tickets/shared";
import type {
  CreateTicketCommentRequest,
  TicketBundle,
  TicketAttachmentUpload,
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

const TIMER_TONE_CLASS = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

export function TicketDetailPanel({
  currentUser,
  ticketBundle,
  detailLoading = false,
  busy = false,
  onOpenEdit,
  onOpenAssignment,
  onOpenStatus,
  onDeleteTicket,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  onCreateAttachment,
  onDeleteAttachment,
}: TicketDetailPanelProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

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
            <p className="mt-4 text-sm font-medium text-slate-700">
              {getTicketProgressLabel(detail)}
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
              {currentUser.role === "ADMIN" ? "Delete ticket" : "Withdraw ticket"}
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
              <dd>
                {detail.resourceName
                  ? detail.resourceCode
                    ? `${detail.resourceName} (${detail.resourceCode})`
                    : detail.resourceName
                  : "No specific resource"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Resource type</dt>
              <dd>{detail.resourceCategoryName || "Not provided"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Location</dt>
              <dd>{detail.locationName || "Not provided"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Building</dt>
              <dd>{detail.locationBuilding || "Not provided"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Floor</dt>
              <dd>{detail.locationFloor || "Not provided"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Room</dt>
              <dd>{detail.locationRoomIdentifier || "Not provided"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Location notes</dt>
              <dd>{detail.locationDescription || "Not provided"}</dd>
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
            Process tracker
          </p>
          <div className="mt-5 space-y-4">
            {WORKFLOW_STEPS.map((step, index) => {
              const isCompleted = detail.status !== "REJECTED" && index < workflowStepIndex;
              const isCurrent = detail.status !== "REJECTED" && index === workflowStepIndex;

              return (
                <div
                  key={step.status}
                  className={`rounded-[1.2rem] border p-4 ${
                    isCurrent
                      ? "border-teal-200 bg-teal-50/70"
                      : isCompleted
                        ? "border-emerald-200 bg-emerald-50/70"
                        : "border-slate-200 bg-slate-50/70"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{step.label}</p>
                      <p className="mt-1 text-sm leading-7 text-slate-600">{step.description}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                        isCurrent
                          ? "bg-teal-100 text-teal-800"
                          : isCompleted
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isCurrent ? "Current" : isCompleted ? "Done" : "Pending"}
                    </span>
                  </div>
                </div>
              );
            })}

            {detail.status === "REJECTED" ? (
              <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-700">
                <p className="font-semibold">Rejected by admin</p>
                <p>{detail.rejectionReason || "A rejection reason has not been recorded yet."}</p>
              </div>
            ) : null}
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-white/70 bg-white/85 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Service timers
          </p>
          <div className="mt-5 grid gap-4">
            <div
              className={`rounded-[1.2rem] border p-4 ${
                TIMER_TONE_CLASS[firstResponseState.tone]
              }`}
            >
              <p className="text-sm font-semibold">Time to first response</p>
              <p className="mt-2 text-xl font-semibold tracking-tight">{firstResponseState.label}</p>
              <p className="mt-2 text-sm">
                Target: {getSlaTargetLabel(detail.priority, "firstResponse")}
              </p>
              <p className="mt-1 text-sm">
                First response recorded: {formatDateTime(detail.firstRespondedAt)}
              </p>
            </div>

            <div
              className={`rounded-[1.2rem] border p-4 ${
                TIMER_TONE_CLASS[resolutionState.tone]
              }`}
            >
              <p className="text-sm font-semibold">Time to resolution</p>
              <p className="mt-2 text-xl font-semibold tracking-tight">{resolutionState.label}</p>
              <p className="mt-2 text-sm">
                Target: {getSlaTargetLabel(detail.priority, "resolution")}
              </p>
              <p className="mt-1 text-sm">Resolved at: {formatDateTime(detail.resolvedAt)}</p>
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

        <article className="rounded-[1.5rem] border border-white/70 bg-white/85 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Lifecycle notes
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
              <dt className="font-semibold text-slate-900">First response at</dt>
              <dd>{formatDateTime(detail.firstRespondedAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Resolved at</dt>
              <dd>{formatDateTime(detail.resolvedAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Rejected at</dt>
              <dd>{formatDateTime(detail.rejectedAt)}</dd>
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
        onUpdate={onUpdateComment}
        onDelete={onDeleteComment}
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
