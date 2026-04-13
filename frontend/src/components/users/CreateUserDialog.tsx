"use client";

import { useState } from "react";

import type { CreateUserRequest } from "@/lib/users/types";
import type { UserStatus } from "@/types/auth";

type CreateUserDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateUserRequest) => Promise<void>;
};

const STATUS_OPTIONS: UserStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];

export function CreateUserDialog({ open, onClose, onSubmit }: CreateUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Create user
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Add a staff or admin account
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <form
          className="mt-8 space-y-4"
          action={async (formData) => {
            setIsSubmitting(true);
            setErrorMessage(null);
            try {
              await onSubmit({
                email: String(formData.get("email") ?? ""),
                firstName: String(formData.get("firstName") ?? "") || undefined,
                lastName: String(formData.get("lastName") ?? "") || undefined,
                displayName: String(formData.get("displayName") ?? "") || undefined,
                phone: String(formData.get("phone") ?? "") || undefined,
                profileImageUrl: String(formData.get("profileImageUrl") ?? "") || undefined,
                role: formData.get("role") as "STAFF" | "ADMIN",
                status: formData.get("status") as UserStatus,
              });
              onClose();
            } catch (error) {
              setErrorMessage(error instanceof Error ? error.message : "Could not create the user.");
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <input name="email" type="email" required placeholder="Email" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
            <select name="role" defaultValue="STAFF" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500">
              <option value="STAFF">STAFF</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <input name="firstName" placeholder="First name" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
            <input name="lastName" placeholder="Last name" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
            <input name="displayName" placeholder="Display name" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
            <select name="status" defaultValue="ACTIVE" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500">
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <input name="phone" placeholder="Phone" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
            <input name="profileImageUrl" placeholder="Profile image URL" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500" />
          </div>

          {errorMessage ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
            >
              {isSubmitting ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
