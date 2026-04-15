"use client";

import { useState } from "react";

import { TicketDialog } from "@/components/tickets/TicketDialog";
import { TicketApiError } from "@/lib/tickets/shared";
import { validateAssignmentForm } from "@/lib/tickets/validation";
import type { TicketAssignmentFormValues, TicketDetail } from "@/lib/tickets/types";
import type { AdminUserSummary } from "@/lib/users/types";

type AssignmentDialogProps = {
  open: boolean;
  busy?: boolean;
  ticket: TicketDetail | null;
  staffUsers: AdminUserSummary[];
  onClose: () => void;
  onSubmit: (payload: { assignedStaffUserId: number; assignmentNote?: string }) => Promise<void>;
};

function getInitialValues(ticket: TicketDetail | null): TicketAssignmentFormValues {
  return {
    assignedStaffUserId: ticket?.assignedStaffUserId ? String(ticket.assignedStaffUserId) : "",
    assignmentNote: "",
  };
}

export function AssignmentDialog({
  open,
  busy = false,
  ticket,
  staffUsers,
  onClose,
  onSubmit,
}: AssignmentDialogProps) {
  const [values, setValues] = useState<TicketAssignmentFormValues>(getInitialValues(ticket));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const inputClassName =
    "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white";

  return (
    <TicketDialog
      open={open}
      onClose={onClose}
      title="Assign staff owner"
      description="Admins can assign or reassign a staff member. The backend records assignment history automatically and adds a system status note."
      widthClassName="max-w-2xl"
    >
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setFormError(null);

          const validationErrors = validateAssignmentForm(values);
          if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
          }

          try {
            setErrors({});
            await onSubmit({
              assignedStaffUserId: Number(values.assignedStaffUserId),
              assignmentNote: values.assignmentNote.trim() || undefined,
            });
            onClose();
          } catch (error) {
            if (error instanceof TicketApiError) {
              setErrors(error.validationErrors);
            }
            setFormError(error instanceof Error ? error.message : "Assignment failed.");
          }
        }}
      >
        {ticket ? (
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
            <p className="font-semibold text-slate-900">{ticket.ticketNumber}</p>
            <p>{ticket.title}</p>
            <p className="mt-2">
              Current staff owner: {ticket.assignedStaffDisplayName ?? "No one assigned yet"}
            </p>
          </div>
        ) : null}

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Staff member
          <select
            value={values.assignedStaffUserId}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                assignedStaffUserId: event.target.value,
              }))
            }
            className={inputClassName}
          >
            <option value="">Choose staff owner</option>
            {staffUsers.map((staffUser) => (
              <option key={staffUser.id} value={staffUser.id}>
                {staffUser.displayName} · {staffUser.email}
              </option>
            ))}
          </select>
          {errors.assignedStaffUserId ? (
            <span className="text-xs text-rose-600">{errors.assignedStaffUserId}</span>
          ) : null}
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Assignment note
          <textarea
            rows={4}
            value={values.assignmentNote}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                assignmentNote: event.target.value,
              }))
            }
            className={`${inputClassName} min-h-28 resize-y`}
            placeholder="Optional handover notes, expectations, or operational context."
          />
        </label>

        {staffUsers.length === 0 ? (
          <p className="rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No active staff users are available. Create or reactivate a staff account from the
            Users page first.
          </p>
        ) : null}

        {formError ? (
          <p className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
          <button
            type="submit"
            disabled={busy || staffUsers.length === 0}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Saving assignment..." : "Save assignment"}
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
