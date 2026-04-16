import { toTicketTitleCase } from "@/lib/tickets/shared";
import type { TicketPriority } from "@/lib/tickets/types";

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  LOW: "bg-slate-100 text-slate-700 border-slate-200",
  MEDIUM: "bg-teal-100 text-teal-800 border-teal-200",
  HIGH: "bg-orange-100 text-orange-900 border-orange-200",
  URGENT: "bg-red-100 text-red-800 border-red-200",
};

type TicketPriorityBadgeProps = {
  priority: TicketPriority;
};

export function TicketPriorityBadge({ priority }: TicketPriorityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${PRIORITY_STYLES[priority]}`}
    >
      {toTicketTitleCase(priority)}
    </span>
  );
}
