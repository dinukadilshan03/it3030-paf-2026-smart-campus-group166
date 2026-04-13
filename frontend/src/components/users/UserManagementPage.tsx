"use client";

import { useState, useTransition } from "react";

import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { CredentialDialog } from "@/components/users/CredentialDialog";
import { UserDetailPanel } from "@/components/users/UserDetailPanel";
import { UserFilters } from "@/components/users/UserFilters";
import { UserList } from "@/components/users/UserList";
import {
  createLocalCredentialsClient,
  createUserClient,
  deleteLocalCredentialsClient,
  getUserDetailClient,
  listUsersClient,
  resetLocalPasswordClient,
  updateUserClient,
  updateUserRoleClient,
  updateUserStatusClient,
} from "@/lib/users/client";
import type {
  AdminUserDetail,
  AdminUserSummary,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters as UserFiltersValue,
} from "@/lib/users/types";
import type { UserStatus } from "@/types/auth";

type UserManagementPageProps = {
  initialUsers: AdminUserSummary[];
  initialSelectedUser: AdminUserDetail | null;
};

export function UserManagementPage({
  initialUsers,
  initialSelectedUser,
}: UserManagementPageProps) {
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(initialSelectedUser);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    initialSelectedUser?.id ?? initialUsers[0]?.id ?? null,
  );
  const [filters, setFilters] = useState<UserFiltersValue>({ role: "", status: "", search: "" });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [credentialMode, setCredentialMode] = useState<"create" | "reset" | null>(null);
  const [isPending, startTransition] = useTransition();

  const refreshUsers = async (targetUserId?: number | null) => {
    const nextUsers = await listUsersClient(filters);
    setUsers(nextUsers);

    const nextSelectedId =
      targetUserId ??
      (nextUsers.some((user) => user.id === selectedUserId)
        ? selectedUserId
        : nextUsers[0]?.id ?? null);
    setSelectedUserId(nextSelectedId);

    if (nextSelectedId == null) {
      setSelectedUser(null);
      return;
    }

    const detail = await getUserDetailClient(nextSelectedId);
    setSelectedUser(detail);
  };

  const handleSelectUser = (id: number) => {
    startTransition(async () => {
      setFeedback(null);
      setSelectedUserId(id);
      setSelectedUser(await getUserDetailClient(id));
    });
  };

  const runMutation = (message: string, action: () => Promise<AdminUserDetail>) =>
    new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          setFeedback(null);
          const detail = await action();
          setSelectedUser(detail);
          setSelectedUserId(detail.id);
          await refreshUsers(detail.id);
          setFeedback(message);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });

  return (
    <>
      <section className="space-y-6">
        <div className="rounded-[1.75rem] border border-white/70 bg-white/85 p-8 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Admin workflow
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                User management
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Manage platform access, profile details, role assignments, account
                status, and local login credentials for staff and admin users from
                one workspace. Students remain Google-only accounts.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCreateDialogOpen(true)}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create staff/admin user
            </button>
          </div>
        </div>

        <UserFilters
          value={filters}
          onChange={setFilters}
          onApply={() =>
            startTransition(async () => {
              setFeedback(null);
              await refreshUsers();
            })
          }
        />

        {feedback ? (
          <p className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {feedback}
          </p>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
          <section className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                User directory
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Select a user to review profile, access, and credential state.
              </p>
            </div>
            <UserList
              users={users}
              selectedUserId={selectedUserId}
              onSelect={handleSelectUser}
            />
          </section>

          <UserDetailPanel
            key={
              selectedUser
                ? `${selectedUser.id}-${selectedUser.role}-${selectedUser.status}-${selectedUser.hasLocalCredentials}-${selectedUser.mustChangePassword}-${selectedUser.updatedAt}`
                : "empty"
            }
            user={selectedUser}
            busy={isPending}
            onSaveProfile={(payload: UpdateUserRequest) =>
              new Promise<void>((resolve, reject) => {
                startTransition(async () => {
                  try {
                    setFeedback(null);
                    const detail = await updateUserClient(selectedUser!.id, payload);
                    setSelectedUser(detail);
                    setSelectedUserId(detail.id);
                    await refreshUsers(detail.id);
                    setFeedback("Profile updated.");
                    resolve();
                  } catch (error) {
                    reject(error);
                  }
                });
              })
            }
            onRoleChange={(role) =>
              runMutation("User role updated.", () =>
                updateUserRoleClient(selectedUser!.id, { role }),
              )
            }
            onStatusChange={(status: UserStatus) =>
              runMutation("User status updated.", async () => {
                if (
                  selectedUser?.role === "ADMIN" &&
                  status !== "ACTIVE" &&
                  !window.confirm(
                    "Deactivate or suspend this admin account? The backend may block this if it is the last active admin.",
                  )
                ) {
                  return selectedUser;
                }
                return updateUserStatusClient(selectedUser!.id, { status });
              })
            }
            onCreateCredentials={() => setCredentialMode("create")}
            onResetPassword={() => setCredentialMode("reset")}
            onDeleteCredentials={() =>
              runMutation("Local login removed.", () =>
                deleteLocalCredentialsClient(selectedUser!.id),
              )
            }
          />
        </div>
      </section>

      <CreateUserDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={async (payload: CreateUserRequest) => {
          const detail = await createUserClient(payload);
          setSelectedUser(detail);
          setSelectedUserId(detail.id);
          await refreshUsers(detail.id);
          setFeedback("User created successfully.");
        }}
      />

      <CredentialDialog
        open={credentialMode !== null && selectedUser !== null}
        mode={credentialMode ?? "create"}
        email={selectedUser?.email ?? ""}
        onClose={() => setCredentialMode(null)}
        onSubmit={async (temporaryPassword) => {
          if (!selectedUser) return;

          const detail =
            credentialMode === "create"
              ? await createLocalCredentialsClient(selectedUser.id, { temporaryPassword })
              : await resetLocalPasswordClient(selectedUser.id, { temporaryPassword });
          setSelectedUser(detail);
          setSelectedUserId(detail.id);
          await refreshUsers(detail.id);
          setFeedback(
            credentialMode === "create"
              ? "Local credentials created."
              : "Temporary password reset.",
          );
        }}
      />
    </>
  );
}
