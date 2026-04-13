import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { redirectIfAuthenticated } from "@/lib/auth/session";
import { resolveAuthFeedback } from "@/lib/auth/feedback";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    reason?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfAuthenticated("/dashboard");
  const resolvedSearchParams = await searchParams;
  const feedback = resolveAuthFeedback(
    resolvedSearchParams.error,
    resolvedSearchParams.reason,
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          SmartCampus login
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Welcome back
        </h1>
        <div className="mt-4">
          <p
            className={`rounded-2xl px-4 py-3 text-sm leading-7 ${
              feedback.tone === "error"
                ? "border border-amber-200 bg-amber-50 text-amber-800"
                : "border border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            {feedback.message}
          </p>
        </div>
        <div className="mt-8">
          <GoogleSignInButton className="w-full justify-center" />
        </div>
      </section>
    </main>
  );
}
