"use client";

import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/tickets/shared";
import { toTicketTitleCase } from "@/lib/tickets/shared";
import type { TicketCategorySummary, TicketFilters as TicketFilterValues } from "@/lib/tickets/types";

type TicketFiltersProps = {
  value: Required<TicketFilterValues>;
  categories: TicketCategorySummary[];
  busy?: boolean;
  onChange: (nextValue: Required<TicketFilterValues>) => void;
  onApply: () => void;
  onReset: () => void;
};

export function TicketFilters({
  value,
  categories,
  busy = false,
  onChange,
  onApply,
  onReset,
}: TicketFiltersProps) {
  return (
    <section className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Queue filters
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
            Narrow the ticket list
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Search by ticket number, title, or category and focus the workspace on the
            incidents that need action now.
          </p>
        </div>
      </div>

      <form
        className="mt-6 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onApply();
        }}
      >
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Search
          <input
            value={value.search}
            onChange={(event) => onChange({ ...value, search: event.target.value })}
            placeholder="Ticket number, issue title, category"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Status
            <select
              value={value.status}
              onChange={(event) =>
                onChange({
                  ...value,
                  status: (event.target.value as Required<TicketFilterValues>["status"]) || "",
                })
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white"
            >
              <option value="">All statuses</option>
              {TICKET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {toTicketTitleCase(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Priority
            <select
              value={value.priority}
              onChange={(event) =>
                onChange({
                  ...value,
                  priority: (event.target.value as Required<TicketFilterValues>["priority"]) || "",
                })
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white"
            >
              <option value="">All priorities</option>
              {TICKET_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {toTicketTitleCase(priority)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Category
          <select
            value={value.ticketCategoryId}
            onChange={(event) =>
              onChange({
                ...value,
                ticketCategoryId: event.target.value ? Number(event.target.value) : "",
              })
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.isActive ? "" : " (Inactive)"}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Loading queue..." : "Apply filters"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onReset}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reset
          </button>
        </div>
      </form>
    </section>
  );
}
