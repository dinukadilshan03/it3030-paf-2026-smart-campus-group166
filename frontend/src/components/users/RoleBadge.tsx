import type { RoleCode } from "@/types/auth";

type RoleBadgeProps = {
  role: RoleCode | null;
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const label = role ?? "Unassigned";
  const tone =
    role === "ADMIN"
      ? "bg-slate-950 text-slate-50"
      : role === "STAFF"
        ? "bg-sky-100 text-sky-900"
        : "bg-emerald-100 text-emerald-900";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}
