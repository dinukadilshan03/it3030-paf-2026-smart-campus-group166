"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { clientApiFetch } from "@/lib/api/client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await clientApiFetch("/api/v1/auth/logout", {
          method: "POST",
        });
      } finally {
        router.replace("/login?reason=signed_out");
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
    >
      {isPending ? "Signing out..." : "Logout"}
    </button>
  );
}
