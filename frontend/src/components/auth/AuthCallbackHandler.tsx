"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { clientApiFetch } from "@/lib/api/client";
import type { AuthApiError, CurrentUser } from "@/types/auth";

export function AuthCallbackHandler() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function resolveSession() {
      try {
        const response = await clientApiFetch("/api/v1/auth/me", {
          cache: "no-store",
        });
        const user = response.ok ? ((await response.json()) as CurrentUser) : null;

        if (!isMounted) {
          return;
        }

        if (user?.authenticated) {
          router.replace("/dashboard");
          router.refresh();
          return;
        }

        if (!response.ok) {
          const apiError = (await response.json().catch(() => null)) as AuthApiError | null;
          if (apiError?.code) {
            router.replace(`/login?error=${apiError.code}`);
            return;
          }
        }
      } catch {
        // Redirect below on failure.
      }

      if (isMounted) {
        router.replace("/login?error=oauth_failed");
      }
    }

    void resolveSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        Finalizing sign-in
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
        Connecting your SmartCampus session
      </h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Hold on while we confirm your Google login with the backend and open the
        workspace.
      </p>
    </div>
  );
}
