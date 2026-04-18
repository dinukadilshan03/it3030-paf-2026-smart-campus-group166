import { LocalSignInForm } from "@/components/auth/LocalSignInForm";
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.16),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.32),rgba(255,255,255,0))]" />
      <div className="absolute left-[-8rem] top-[-6rem] h-56 w-56 rounded-full bg-cyan-300/15 blur-3xl" />
      <div className="absolute bottom-[-7rem] right-[-6rem] h-64 w-64 rounded-full bg-amber-300/14 blur-3xl" />

      <section className="relative z-10 w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/88 shadow-[0_34px_110px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <aside className="relative overflow-hidden bg-[linear-gradient(160deg,#07111f,#0f172a_48%,#12253a)] px-7 py-8 text-white sm:px-10 sm:py-10 lg:px-12 lg:py-12">
            <div className="absolute inset-0 opacity-70">
              <div className="absolute left-0 top-0 h-44 w-44 rounded-full bg-cyan-300/14 blur-3xl" />
              <div className="absolute bottom-[-5rem] right-[-2rem] h-56 w-56 rounded-full bg-amber-300/12 blur-3xl" />
            </div>

            <div className="relative flex h-full flex-col justify-between gap-10">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
                  SmartCampus access
                </div>

                <div className="max-w-lg space-y-5">
                  <h1 className="text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
                    Sign in to the workspace that keeps campus moving.
                  </h1>
                  <p className="max-w-xl text-sm leading-7 text-white/68 sm:text-base">
                    Use Google for student access or a local account for staff and admins.
                    The redesigned login keeps the flow simple while giving the page a wider,
                    more confident presence.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <article className="rounded-[1.35rem] border border-white/10 bg-white/8 p-4 backdrop-blur">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-100/75">
                    Students
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/78">
                    Quick Google sign-in for booking, notifications, and support.
                  </p>
                </article>
                <article className="rounded-[1.35rem] border border-white/10 bg-white/8 p-4 backdrop-blur">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-100/75">
                    Staff
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/78">
                    Local credentials for operational tools and internal workflows.
                  </p>
                </article>
                <article className="rounded-[1.35rem] border border-white/10 bg-white/8 p-4 backdrop-blur">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-100/75">
                    Admins
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/78">
                    Faster access to dashboards, resources, and management screens.
                  </p>
                </article>
              </div>
            </div>
          </aside>

          <div className="px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <div className="mx-auto flex h-full max-w-xl flex-col justify-center">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  SmartCampus login
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                      Welcome back
                    </h2>
                    <p className="mt-2 max-w-lg text-sm leading-7 text-slate-600">
                      Choose the access path that matches your role and continue into the
                      platform.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p
                  className={`rounded-[1.35rem] px-4 py-3 text-sm leading-7 ${
                    feedback.tone === "error"
                      ? "border border-amber-200 bg-amber-50 text-amber-800"
                      : "border border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  {feedback.message}
                </p>
              </div>

              <div className="mt-8 space-y-5">
                <section className="rounded-[1.6rem] border border-slate-200 bg-slate-50/85 p-5 shadow-[0_10px_34px_rgba(15,23,42,0.05)] sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Student access
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                        Google sign-in
                      </h3>
                      <p className="mt-2 max-w-md text-sm leading-7 text-slate-600">
                        Students enter SmartCampus using their Google account.
                      </p>
                    </div>
                    <div className="sm:min-w-[220px]">
                      <GoogleSignInButton className="w-full justify-center" />
                    </div>
                  </div>
                </section>

                <section className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_10px_34px_rgba(15,23,42,0.05)] sm:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Staff and admin access
                    </p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                      Email and password
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-7 text-slate-600">
                      Staff and admin users sign in with the local account created by an
                      administrator.
                    </p>
                  </div>

                  <div className="mt-6">
                    <LocalSignInForm />
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
