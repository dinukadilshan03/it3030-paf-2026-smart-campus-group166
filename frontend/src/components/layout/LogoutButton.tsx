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
        router.replace("/");
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-50"
    >
      {isPending ? "Signing out..." : "Logout"}
    </button>
  );
}
