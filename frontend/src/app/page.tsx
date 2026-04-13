import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { redirectIfAuthenticated } from "@/lib/auth/session";

export default async function HomePage() {
  await redirectIfAuthenticated("/dashboard");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="hero-glow hero-glow-left" />
      <div className="hero-glow hero-glow-right" />
      <section className="relative z-10 w-full max-w-5xl rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur md:p-12">
        <div className="grid gap-10 md:grid-cols-[1.25fr_0.9fr] md:items-end">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
              Shared Campus Workspace
            </span>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                SmartCampus keeps bookings, tickets, and facilities in one place.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                This shell is ready for your team to plug in the real workflow pages.
                Sign in with Google to reach the protected workspace and route scaffolding.
              </p>
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-slate-50 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-300">
                Access the workspace
              </p>
              <h2 className="text-2xl font-semibold">Sign in with your campus Google account</h2>
              <p className="text-sm leading-7 text-slate-300">
                Authentication is handled by the Spring Boot backend. The frontend only
                consumes the active session and renders role-aware navigation.
              </p>
              <GoogleSignInButton className="mt-2 w-full justify-center" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
