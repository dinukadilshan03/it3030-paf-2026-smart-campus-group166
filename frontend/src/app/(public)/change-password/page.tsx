import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { getCurrentUser } from "@/lib/auth/session";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();

  if (!user.authenticated) {
    redirect("/login");
  }

  if (!user.passwordChangeRequired) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Password update
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Change your temporary password
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Before you continue into SmartCampus, set a new password for your staff
          or admin account.
        </p>
        <div className="mt-8">
          <ChangePasswordForm />
        </div>
      </section>
    </main>
  );
}
