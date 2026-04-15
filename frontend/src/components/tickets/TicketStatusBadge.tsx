import { toTicketTitleCase } from "@/lib/tickets/shared";
import type { TicketStatus } from "@/lib/tickets/types";

const STATUS_STYLES: Record<TicketStatus, string> = {
  OPEN: "bg-sky-100 text-sky-800 border-sky-200",
  IN_PROGRESS: "bg-amber-100 text-amber-900 border-amber-200",
  RESOLVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CLOSED: "bg-slate-200 text-slate-700 border-slate-300",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
};

type TicketStatusBadgeProps = {
  status: TicketStatus;
};

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${STATUS_STYLES[status]}`}
    >
      {toTicketTitleCase(status)}
    </span>
  );
}
