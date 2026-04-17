"use client";

import { useState } from "react";

import { TicketDialog } from "@/components/tickets/TicketDialog";
import {
  getAllowedStatusTargets,
  TicketApiError,
  toTicketTitleCase,
} from "@/lib/tickets/shared";
import { validateStatusForm } from "@/lib/tickets/validation";
import type { TicketDetail, TicketStatusFormValues } from "@/lib/tickets/types";
import type { RoleCode } from "@/types/auth";

type StatusUpdateDialogProps = {
  open: boolean;
  busy?: boolean;
  role: RoleCode;
  ticket: TicketDetail | null;
  onClose: () => void;
  onSubmit: (payload: {
    status: TicketDetail["status"];
    resolutionSummary?: string;
    rejectionReason?: string;
  }) => Promise<void>;
};

function getInitialValues(role: RoleCode, ticket: TicketDetail | null): TicketStatusFormValues {
  const nextStatus = ticket ? getAllowedStatusTargets(role, ticket.status)[0] ?? "" : "";
  return {
    status: nextStatus,
    resolutionSummary: ticket?.resolutionSummary ?? "",
    rejectionReason: ticket?.rejectionReason ?? "",
  };
}

export function StatusUpdateDialog({
  open,
  busy = false,
  role,
  ticket,
  onClose,
  onSubmit,
}: StatusUpdateDialogProps) {
  const [values, setValues] = useState<TicketStatusFormValues>(getInitialValues(role, ticket));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const availableStatuses = ticket ? getAllowedStatusTargets(role, ticket.status) : [];
  const inputClassName =
    "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white";

  return (
    <TicketDialog
      open={open}
      onClose={onClose}
      title="Advance ticket lifecycle"
      description="The backend enforces valid transitions. Staff move assigned tickets into progress and resolve them, while admins reject invalid requests or close resolved work."
      widthClassName="max-w-2xl"
    >
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setFormError(null);

          const validationErrors = validateStatusForm(values);
          if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
          }

          try {
            setErrors({});
            await onSubmit({
              status: values.status as TicketDetail["status"],
              resolutionSummary: values.resolutionSummary.trim() || undefined,
              rejectionReason: values.rejectionReason.trim() || undefined,
            });
            onClose();
          } catch (error) {
            if (error instanceof TicketApiError) {
              setErrors(error.validationErrors);
            }
            setFormError(error instanceof Error ? error.message : "Status update failed.");
          }
        }}
      >
        {ticket ? (
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
            <p className="font-semibold text-slate-900">{ticket.ticketNumber}</p>
            <p>{ticket.title}</p>
            <p className="mt-2">
              Current state: <span className="font-semibold">{toTicketTitleCase(ticket.status)}</span>
            </p>
          </div>
        ) : null}

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Next status
          <select
            value={values.status}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                status: event.target.value as TicketStatusFormValues["status"],
              }))
            }
            className={inputClassName}
          >
            <option value="">Choose next status</option>
            {availableStatuses.map((status) => (
              <option key={status} value={status}>
                {toTicketTitleCase(status)}
              </option>
            ))}
          </select>
          {errors.status ? <span className="text-xs text-rose-600">{errors.status}</span> : null}
        </label>

        {values.status === "RESOLVED" ? (
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Resolution summary
            <textarea
              rows={4}
              value={values.resolutionSummary}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  resolutionSummary: event.target.value,
                }))
              }
              className={`${inputClassName} min-h-28 resize-y`}
              placeholder="Describe the fix, replacement, workaround, or recovery steps."
            />
            {errors.resolutionSummary ? (
              <span className="text-xs text-rose-600">{errors.resolutionSummary}</span>
            ) : null}
          </label>
        ) : null}

        {values.status === "REJECTED" ? (
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Rejection reason
            <textarea
              rows={4}
              value={values.rejectionReason}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  rejectionReason: event.target.value,
                }))
              }
              className={`${inputClassName} min-h-28 resize-y`}
              placeholder="Explain why the request cannot proceed or why it is invalid."
            />
            {errors.rejectionReason ? (
              <span className="text-xs text-rose-600">{errors.rejectionReason}</span>
            ) : null}
          </label>
        ) : null}

        {values.status === "CLOSED" && ticket?.resolutionSummary ? (
          <div className="rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-900">
            <p className="font-semibold">Resolution already captured</p>
            <p>{ticket.resolutionSummary}</p>
          </div>
        ) : null}

        {formError ? (
          <p className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
          <button
            type="submit"
            disabled={busy || availableStatuses.length === 0}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Updating status..." : "Update status"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>
    </TicketDialog>
  );
}
