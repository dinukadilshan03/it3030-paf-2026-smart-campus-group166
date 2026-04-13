"use client";

import { useState } from "react";

import { RoleBadge } from "@/components/users/RoleBadge";
import { StatusBadge } from "@/components/users/StatusBadge";
import type { AdminUserDetail, UpdateUserRequest } from "@/lib/users/types";
import type { UserStatus } from "@/types/auth";

type UserDetailPanelProps = {
  user: AdminUserDetail | null;
  busy: boolean;
  onSaveProfile: (payload: UpdateUserRequest) => Promise<void>;
  onRoleChange: (role: "STAFF" | "ADMIN") => Promise<void>;
  onStatusChange: (status: UserStatus) => Promise<void>;
  onCreateCredentials: () => void;
  onResetPassword: () => void;
  onDeleteCredentials: () => Promise<void>;
};

function formatDate(value: string | null) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function UserDetailPanel({
  user,
  busy,
  onSaveProfile,
  onRoleChange,
  onStatusChange,
  onCreateCredentials,
  onResetPassword,
  onDeleteCredentials,
}: UserDetailPanelProps) {
  const [formState, setFormState] = useState<UpdateUserRequest>(() => ({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    displayName: user?.displayName ?? "",
    phone: user?.phone ?? "",
    profileImageUrl: user?.profileImageUrl ?? "",
  }));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/75 p-8 text-sm leading-7 text-slate-600">
        Select a user to view their details and management actions.
      </section>
    );
  }
  const isStudent = user.role === "STUDENT";

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            User detail
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {user.displayName}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RoleBadge role={user.role} />
          <StatusBadge status={user.status} />
        </div>
      </div>

      <div className="mt-6 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
        <p>Created: {formatDate(user.createdAt)}</p>
        <p>Updated: {formatDate(user.updatedAt)}</p>
        <p>Last login: {formatDate(user.lastLoginAt)}</p>
        <p>
          Login:{" "}
          {user.loginMethod === "GOOGLE"
            ? "Google sign-in"
            : user.hasLocalCredentials
              ? user.mustChangePassword
                ? "Local login, password change pending"
                : "Local login ready"
              : "Local login not created"}
        </p>
      </div>

      <form
        className="mt-8 space-y-4"
        action={async () => {
          try {
            setErrorMessage(null);
            await onSaveProfile(formState);
          } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Could not save the profile.");
          }
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={formState.firstName ?? ""}
            onChange={(event) => setFormState({ ...formState, firstName: event.target.value })}
            placeholder="First name"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
          <input
            value={formState.lastName ?? ""}
            onChange={(event) => setFormState({ ...formState, lastName: event.target.value })}
            placeholder="Last name"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
          <input
            value={formState.displayName ?? ""}
            onChange={(event) => setFormState({ ...formState, displayName: event.target.value })}
            placeholder="Display name"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
          <input
            value={formState.phone ?? ""}
            onChange={(event) => setFormState({ ...formState, phone: event.target.value })}
            placeholder="Phone"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />
          <input
            value={formState.profileImageUrl ?? ""}
            onChange={(event) =>
              setFormState({ ...formState, profileImageUrl: event.target.value })
            }
            placeholder="Profile image URL"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 md:col-span-2"
          />
        </div>

        {errorMessage ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
          >
            Save profile
          </button>
        </div>
      </form>

      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Role and status
          </p>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Effective role</label>
              <select
                value={user.role}
                onChange={(event) => onRoleChange(event.target.value as "STAFF" | "ADMIN")}
                disabled={busy || isStudent}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="STAFF">STAFF</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              {isStudent ? (
                <p className="text-xs leading-6 text-slate-500">
                  Student accounts are Google-provisioned and are not reassigned from this page.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Account status</label>
              <select
                value={user.status}
                onChange={(event) => onStatusChange(event.target.value as UserStatus)}
                disabled={busy}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
              {user.role === "ADMIN" ? (
                <p className="text-xs leading-6 text-slate-500">
                  Deactivating an admin may be blocked when it would remove the last active admin.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Credential management
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>
              {user.loginMethod === "GOOGLE"
                ? "This user signs in with Google and does not use local credentials."
                : user.hasLocalCredentials
                  ? user.mustChangePassword
                    ? "Local credentials exist and the user must change the temporary password on next sign-in."
                    : "Local credentials exist and the user can sign in with email and password."
                  : "No local credentials have been created for this staff/admin account yet."}
            </p>

            <div className="flex flex-wrap gap-3">
              {!isStudent && !user.hasLocalCredentials ? (
                <button
                  type="button"
                  onClick={onCreateCredentials}
                  disabled={busy}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                >
                  Create credentials
                </button>
              ) : null}

              {!isStudent && user.hasLocalCredentials ? (
                <>
                  <button
                    type="button"
                    onClick={onResetPassword}
                    disabled={busy}
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                  >
                    Reset password
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm("Remove local login from this user?")) {
                        await onDeleteCredentials();
                      }
                    }}
                    disabled={busy}
                    className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-70"
                  >
                    Remove local login
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
