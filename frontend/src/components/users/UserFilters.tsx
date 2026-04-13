"use client";

import type { UserFilters } from "@/lib/users/types";
import type { RoleCode, UserStatus } from "@/types/auth";

type UserFiltersProps = {
  value: UserFilters;
  onChange: (next: UserFilters) => void;
  onApply: () => void;
};

const ROLE_OPTIONS: Array<RoleCode | ""> = ["", "ADMIN", "STAFF", "STUDENT"];
const STATUS_OPTIONS: Array<UserStatus | ""> = ["", "ACTIVE", "INACTIVE", "SUSPENDED"];

export function UserFilters({ value, onChange, onApply }: UserFiltersProps) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row">
        <input
          type="search"
          value={value.search ?? ""}
          onChange={(event) => onChange({ ...value, search: event.target.value })}
          placeholder="Search by name or email"
          className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
        />

        <select
          value={value.role ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              role: event.target.value as UserFilters["role"],
            })
          }
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
        >
          {ROLE_OPTIONS.map((role) => (
            <option key={role || "all-roles"} value={role}>
              {role || "All roles"}
            </option>
          ))}
        </select>

        <select
          value={value.status ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              status: event.target.value as UserFilters["status"],
            })
          }
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status || "all-statuses"} value={status}>
              {status || "All statuses"}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onApply}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Apply filters
        </button>
      </div>
    </section>
  );
}
