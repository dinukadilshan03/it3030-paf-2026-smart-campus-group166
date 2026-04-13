"use client";

import { useState } from "react";

type CredentialDialogProps = {
  open: boolean;
  mode: "create" | "reset";
  email: string;
  onClose: () => void;
  onSubmit: (temporaryPassword: string) => Promise<void>;
};

export function CredentialDialog({
  open,
  mode,
  email,
  onClose,
  onSubmit,
}: CredentialDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!open) return null;

  const title = mode === "create" ? "Create local credentials" : "Reset local password";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/70 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Credential workflow
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              This will apply to {email} and require a password change on next sign-in.
            </p>
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
              await onSubmit(String(formData.get("temporaryPassword") ?? ""));
              onClose();
            } catch (error) {
              setErrorMessage(
                error instanceof Error ? error.message : "Could not complete the credential action.",
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <input
            name="temporaryPassword"
            type="password"
            minLength={8}
            required
            placeholder="Temporary password"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
          />

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
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create credentials"
                  : "Reset password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
