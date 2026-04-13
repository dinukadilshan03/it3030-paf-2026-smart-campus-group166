import type { UserStatus } from "@/types/auth";

type StatusBadgeProps = {
  status: UserStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const tone =
    status === "ACTIVE"
      ? "bg-emerald-100 text-emerald-900"
      : status === "INACTIVE"
        ? "bg-amber-100 text-amber-900"
        : "bg-rose-100 text-rose-900";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  );
}
