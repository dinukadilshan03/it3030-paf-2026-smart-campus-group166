import Link from "next/link";

import { redirectIfAuthenticated } from "@/lib/auth/session";

const implementedModules = [
  {
    title: "Role-based dashboards",
    description:
      "Students, staff, and admins each land in a workspace tailored to their access and core tasks.",
  },
  {
    title: "Resource management",
    description:
      "Resources, categories, locations, and availability data are already wired into the protected app.",
  },
  {
    title: "Booking workflows",
    description:
      "Students can request spaces while admins review, approve, reject, and cancel bookings with status tracking.",
  },
  {
    title: "Ticket operations",
    description:
      "Issue reporting, assignment, comments, attachments, category management, and lifecycle updates are implemented.",
  },
  {
    title: "Notifications and profile",
    description:
      "Users can review in-app notifications and access their shared profile area from the authenticated shell.",
  },
  {
    title: "Admin controls and analytics",
    description:
      "Admins can manage users and review operational analytics, health signals, and generated insights.",
  },
];

const accessModes = [
  {
    title: "Student sign-in",
    description:
      "Students authenticate with Google, then continue into the SmartCampus dashboard and feature pages permitted for their role.",
  },
  {
    title: "Staff and admin sign-in",
    description:
      "Staff and admins use local email and password credentials created and managed through the admin workspace.",
  },
  {
    title: "Role-aware routing",
    description:
      "After authentication, the frontend reads the active session and routes users into the same protected app shell with the correct navigation.",
  },
];

const workspacePreviews = [
  {
    title: "Student workspace",
    description:
      "Focused on finding resources, creating bookings, raising tickets, reviewing notifications, and managing personal account details.",
  },
  {
    title: "Staff workspace",
    description:
      "Built around support operations, especially ticket handling, campus resource visibility, notifications, and profile access.",
  },
  {
    title: "Admin workspace",
    description:
      "Acts as the operational command center for users, resources, bookings, tickets, analytics, notifications, and oversight.",
  },
];

const workflows = [
  "Booking requests move through pending, approval, rejection, and cancellation flows with review tracking.",
  "Ticket management supports creation, assignment, comments, attachments, status changes, and category administration.",
  "Resource administration covers managed spaces, locations, categories, and availability windows.",
  "Notification flows keep users updated on booking decisions, ticket changes, and comment activity.",
];

export default async function HomePage() {
  await redirectIfAuthenticated("/dashboard");

  return (
    <main className="relative overflow-hidden px-6 py-6 md:px-8 md:py-8">
      <div className="hero-glow hero-glow-left" />
      <div className="hero-glow hero-glow-right" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/82 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="grid gap-10 px-6 py-8 md:px-10 md:py-10 xl:grid-cols-[1.3fr_0.85fr] xl:items-end">
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  SmartCampus public home
                </span>
                <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent-strong">
                  Login from here, work in the dashboard
                </span>
              </div>

              <div className="space-y-5">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                  One front door for campus bookings, support tickets, resources, and
                  operational oversight.
                </h1>
                <p className="max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                  SmartCampus starts with a clear public homepage, sends users to the
                  dedicated login page, and then routes each authenticated person into the
                  correct dashboard for their role.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Login to SmartCampus
                </Link>
                <a
                  href="#implemented"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/85 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                >
                  Explore implemented features
                </a>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Public entry
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Guests land here first and can learn what the app already supports
                    before signing in.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-white/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Dedicated login
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Authentication stays on <span className="font-semibold text-slate-900">/login</span> with
                    Google for students and local credentials for staff or admins.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-white/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Protected workspace
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Signed-in users are sent directly to <span className="font-semibold text-slate-900">/dashboard</span> and
                    role checks continue to protect each feature area.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-slate-50 shadow-[0_16px_40px_rgba(15,23,42,0.18)] md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                Typical app flow
              </p>
              <ol className="space-y-4 text-sm leading-7 text-slate-300">
                <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="font-semibold text-white">1.</span> Open SmartCampus on{" "}
                  <span className="font-semibold text-white">/</span> to understand what the
                  platform supports.
                </li>
                <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="font-semibold text-white">2.</span> Use the login button to
                  continue to the dedicated authentication page.
                </li>
                <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="font-semibold text-white">3.</span> Complete Google or local
                  sign-in based on the user role.
                </li>
                <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="font-semibold text-white">4.</span> Work inside the protected
                  dashboard and follow the role-appropriate navigation.
                </li>
              </ol>
              <div className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/10 px-5 py-4">
                <p className="text-sm font-semibold text-white">Why this flow works better</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  It separates public product context from authentication, avoids confusion on
                  the default route, and keeps the actual login experience in one predictable
                  place.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="implemented"
          className="grid gap-6 rounded-[2rem] border border-white/70 bg-white/78 px-6 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.09)] backdrop-blur md:px-10 md:py-10"
        >
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              What&apos;s implemented so far
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              The homepage reflects real functionality already present in the app.
            </h2>
            <p className="text-base leading-8 text-slate-600">
              This is the current front door for SmartCampus, so it should explain what users
              can already do instead of behaving like a partial sign-in screen.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {implementedModules.map((module) => (
              <article
                key={module.title}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50/85 p-5"
              >
                <h3 className="text-lg font-semibold text-slate-950">{module.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{module.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-white/70 bg-white/80 px-6 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.09)] backdrop-blur md:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              How access works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              One login page, two sign-in methods, one protected app shell.
            </h2>
            <div className="mt-6 space-y-4">
              {accessModes.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5"
                >
                  <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/80 px-6 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.09)] backdrop-blur md:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Role workspaces
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              After login, SmartCampus guides each role into the right dashboard.
            </h2>
            <div className="mt-6 grid gap-4">
              {workspacePreviews.map((workspace) => (
                <div
                  key={workspace.title}
                  className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5"
                >
                  <h3 className="text-lg font-semibold text-slate-950">{workspace.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {workspace.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-white/70 bg-white/82 px-6 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.09)] backdrop-blur md:px-10 md:py-10 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Operational workflows
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              The app already supports the main campus operations this homepage should describe.
            </h2>
            <p className="max-w-3xl text-base leading-8 text-slate-600">
              SmartCampus is not just a login shell. The current build already includes the
              workflow backbone for resources, bookings, support tickets, and notifications.
            </p>
            <ul className="grid gap-3">
              {workflows.map((workflow) => (
                <li
                  key={workflow}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-7 text-slate-600"
                >
                  {workflow}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(160deg,rgba(15,23,42,0.98),rgba(15,118,110,0.92))] p-6 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
              Ready to continue
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Start at the public home, then move into your dashboard from one clear login path.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-100/90">
              This keeps the product easier to understand for first-time visitors and easier to
              use for returning users who just need to get back to work.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Go to login
              </Link>
              <a
                href="#implemented"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Review features
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
