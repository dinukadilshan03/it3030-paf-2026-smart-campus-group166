"use client";

import { RoleBadge } from "@/components/users/RoleBadge";
import { StatusBadge } from "@/components/users/StatusBadge";
import type { AdminUserSummary } from "@/lib/users/types";

type UserListProps = {
  users: AdminUserSummary[];
  selectedUserId: number | null;
  onSelect: (id: number) => void;
};

function formatLastLogin(value: string | null) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getCredentialLabel(user: AdminUserSummary) {
  if (user.loginMethod === "GOOGLE") return "Google-only";
  if (!user.hasLocalCredentials) return "No local login";
  if (user.mustChangePassword) return "Password change pending";
  return "Local login ready";
}

export function UserList({ users, selectedUserId, onSelect }: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/75 p-8 text-sm leading-7 text-slate-600">
        No users matched the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => {
        const selected = user.id === selectedUserId;

        return (
          <button
            key={user.id}
            type="button"
            onClick={() => onSelect(user.id)}
            className={`w-full rounded-[1.5rem] border p-5 text-left transition ${
              selected
                ? "border-slate-950 bg-slate-950 text-slate-50 shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
                : "border-slate-200 bg-white/90 text-slate-900 shadow-[0_16px_45px_rgba(15,23,42,0.06)] hover:border-slate-300 hover:bg-white"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={`text-sm font-semibold ${selected ? "text-slate-50" : "text-slate-950"}`}>
                  {user.displayName}
                </p>
                <p className={`mt-1 text-sm ${selected ? "text-slate-300" : "text-slate-600"}`}>
                  {user.email}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <RoleBadge role={user.role} />
                <StatusBadge status={user.status} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium uppercase tracking-[0.18em]">
              <span className={selected ? "text-slate-300" : "text-slate-500"}>
                {getCredentialLabel(user)}
              </span>
              <span className={selected ? "text-slate-300" : "text-slate-500"}>
                Last login: {formatLastLogin(user.lastLoginAt)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
