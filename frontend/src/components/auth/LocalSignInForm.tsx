"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { clientApiFetch } from "@/lib/api/client";
import type { AuthApiError, CurrentUser } from "@/types/auth";

const DEFAULT_ERROR_MESSAGE = "Email and password sign-in did not complete successfully. Please try again.";

function mapLocalError(code?: AuthApiError["code"]) {
  switch (code) {
    case "invalid_credentials":
      return "The email or password you entered is incorrect.";
    case "account_blocked":
      return "Your account is currently blocked from signing in. Please contact an administrator.";
    case "local_login_not_allowed":
      return "This account must use Google sign-in instead of email and password.";
    case "password_change_required":
      return "You must change your temporary password before continuing.";
    default:
      return DEFAULT_ERROR_MESSAGE;
  }
}

export function LocalSignInForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      setErrorMessage(null);

      try {
        const response = await clientApiFetch("/api/v1/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const apiError = (await response.json().catch(() => null)) as AuthApiError | null;
          setErrorMessage(mapLocalError(apiError?.code));
          return;
        }

        const user = (await response.json()) as CurrentUser;
        router.replace(user.passwordChangeRequired ? "/change-password" : "/dashboard");
        router.refresh();
      } catch {
        setErrorMessage(DEFAULT_ERROR_MESSAGE);
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
          placeholder="staff.admin@example.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
          placeholder="Enter your password"
        />
      </div>

      {errorMessage ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Signing in..." : "Sign in with email and password"}
      </button>
    </form>
  );
}
