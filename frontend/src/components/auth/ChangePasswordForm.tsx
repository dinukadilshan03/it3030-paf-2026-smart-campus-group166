"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { clientApiFetch } from "@/lib/api/client";
import type { AuthApiError } from "@/types/auth";

type ChangePasswordFormProps = {
  redirectOnSuccess?: string | null;
  successMessage?: string;
  submitLabel?: string;
  onSuccess?: () => void | Promise<void>;
};

function mapChangePasswordError(code?: AuthApiError["code"]) {
  switch (code) {
    case "invalid_credentials":
      return "Your current password is incorrect.";
    case "account_blocked":
      return "Your account is currently blocked from signing in. Please contact an administrator.";
    default:
      return "We could not update your password right now. Please try again.";
  }
}

export function ChangePasswordForm({
  redirectOnSuccess = "/dashboard",
  successMessage = "Password updated successfully.",
  submitLabel = "Save new password",
  onSuccess,
}: ChangePasswordFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setErrorMessage("The new password and confirmation do not match.");
      return;
    }

    startTransition(async () => {
      setErrorMessage(null);
      setSuccessNotice(null);

      try {
        const response = await clientApiFetch("/api/v1/auth/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        });

        if (!response.ok) {
          const apiError = (await response.json().catch(() => null)) as AuthApiError | null;
          setErrorMessage(mapChangePasswordError(apiError?.code));
          return;
        }

        await onSuccess?.();

        if (redirectOnSuccess) {
          router.replace(redirectOnSuccess);
          router.refresh();
          return;
        }

        setSuccessNotice(successMessage);
      } catch {
        setErrorMessage("We could not update your password right now. Please try again.");
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="currentPassword" className="text-sm font-medium text-slate-700">
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
        />
      </div>

      {errorMessage ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800">
          {errorMessage}
        </p>
      ) : null}

      {successNotice ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-800">
          {successNotice}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Updating password..." : submitLabel}
      </button>
    </form>
  );
}
