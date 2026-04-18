import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  BookOpen,
  CalendarRange,
  ChartColumnIncreasing,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { redirectIfAuthenticated } from "@/lib/auth/session";
import styles from "./page.module.css";

const features = [
  {
    icon: CalendarRange,
    title: "Bookings",
    description: "Reserve spaces and track approvals.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description: "Role-based landing pages for every user type.",
  },
  {
    icon: BookOpen,
    title: "Resources",
    description: "Browse and manage campus resources in one place.",
  },
  {
    icon: ShieldCheck,
    title: "Support",
    description: "Manage tickets and campus issues.",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Stay on top of alerts, replies, and activity.",
  },
  {
    icon: Users,
    title: "Users",
    description: "Admin tools for account oversight and access.",
  },
  {
    icon: ChartColumnIncreasing,
    title: "Analytics",
    description: "Track usage and operational trends.",
  },
  {
    icon: UserRound,
    title: "Profile",
    description: "Manage your shared account details and settings.",
  },
];

const heroExperiences = [
  {
    label: "Student experience",
    description: "Find a space, submit a booking, and follow updates without friction.",
  },
  {
    label: "Staff operations",
    description: "Handle tickets, respond faster, and stay inside one focused workspace.",
  },
  {
    label: "Admin oversight",
    description: "Monitor activity, manage resources, and keep campus operations aligned.",
  },
];

export default async function HomePage() {
  await redirectIfAuthenticated("/dashboard");

  return (
    <main className={styles.page}>
      <div className={`${styles.orb} ${styles.orbLeft}`} />
      <div className={`${styles.orb} ${styles.orbRight}`} />

      <div className="relative z-10">
        <section className="overflow-hidden border-b border-white/10 bg-[linear-gradient(180deg,rgba(9,11,21,0.98),rgba(10,14,30,0.94))] shadow-[0_40px_120px_rgba(4,8,20,0.42)]">
          <div className="px-5 py-5 sm:px-8 lg:px-10">
            <header className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-white">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-sm font-semibold text-slate-950">
                  SC
                </div>
                <div>
                  <p className="text-sm font-medium">SmartCampus</p>
                  <p className="text-xs text-white/55">Campus platform</p>
                </div>
              </div>

              <nav className="hidden items-center gap-8 text-sm text-white/80 md:flex">
                <a href="#platform" className="transition hover:text-white">
                  Platform
                </a>
                <a href="#capabilities" className="transition hover:text-white">
                  Capabilities
                </a>
                <a href="#overview" className="transition hover:text-white">
                  Overview
                </a>
              </nav>

              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="hidden items-center justify-center rounded-full border border-slate-500 bg-slate-800 px-5 py-2.5 text-sm font-semibold !text-white transition hover:border-white hover:bg-white hover:!text-slate-950 sm:inline-flex"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-cyan-300 bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 hover:border-cyan-200"
                >
                  Register
                </Link>
                <button
                  type="button"
                  aria-label="Open navigation"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/6 text-white md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </header>

            <div className="mx-auto max-w-4xl px-2 pb-10 pt-12 text-center sm:pb-12 sm:pt-16">
              <div className="inline-flex rounded-full border border-cyan-300/15 bg-cyan-300/8 px-4 py-2 text-[0.72rem] font-medium tracking-[0.14em] text-cyan-100/80">
                ONE PLACE FOR BOOKINGS, SUPPORT, AND CAMPUS OPERATIONS
              </div>

              <h1 className="mt-6 text-4xl font-semibold tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
                A smarter front door for modern campus operations.
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                Clean public entry, simple login, and a premium product experience for students,
                staff, and admins.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="#platform"
                  className="inline-flex min-w-[220px] items-center justify-center rounded-full border border-cyan-300/70 bg-cyan-300 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_16px_36px_rgba(103,232,249,0.18)] transition hover:bg-cyan-200 hover:border-cyan-200"
                >
                  Explore platform
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.22em] text-white/45">
                <span>Bookings</span>
                <span>Resources</span>
                <span>Support Tickets</span>
                <span>Dashboards</span>
                <span>Notifications</span>
              </div>
            </div>
          </div>

          <div id="overview" className="relative px-0 pb-0">
            <div className={styles.heroScene}>
              <Image
                src="/homepage-hero.png"
                alt="SmartCampus campus walkway with students, digital displays, and smart kiosks."
                fill
                priority
                className={styles.heroImage}
                sizes="100vw"
              />
              <div className={styles.heroOverlay} />
              <div className={styles.heroShadeLeft} />
              <div className={styles.heroFade} />

              <div className="relative min-h-[380px] px-4 py-6 sm:min-h-[440px] sm:px-8 sm:py-8 lg:min-h-[560px] lg:px-12">
                <div className="grid gap-3 sm:max-w-sm lg:pt-8">
                  {heroExperiences.map((experience, index) => (
                    <div
                      key={experience.label}
                      className={`rounded-[1.35rem] border border-white/14 bg-[rgba(7,12,22,0.82)] p-4 text-left shadow-[0_20px_50px_rgba(2,6,18,0.34)] ${
                        index === 1 ? "sm:translate-x-8" : ""
                      } ${index === 2 ? "sm:translate-x-16" : ""}`}
                    >
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
                        {experience.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/78">
                        {experience.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[linear-gradient(180deg,rgba(7,12,22,0.96),rgba(7,12,22,0.99))] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            id="platform"
            className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_16px_40px_rgba(2,8,23,0.18)] backdrop-blur-xl"
          >
            <div className="grid gap-8 px-6 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-start lg:px-10 lg:py-10">
              <div className="max-w-xl">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-white/45">
                  Platform surface
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                  Everything in the app, grouped into one clear overview.
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-7 text-white/62 sm:text-base">
                  The home page now reflects the actual product breadth: booking, resources,
                  tickets, dashboards, notifications, users, analytics, and profile access.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.35rem] border border-white/10 bg-black/10 p-4">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-100/75">
                      For students
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/74">
                      Book spaces, check notifications, update profile details, and track support.
                    </p>
                  </div>
                  <div className="rounded-[1.35rem] border border-white/10 bg-black/10 p-4">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cyan-100/75">
                      For staff and admins
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/74">
                      Manage tickets, resources, dashboards, and user oversight from one shell.
                    </p>
                  </div>
                </div>
              </div>

              <div id="capabilities" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {features.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <article
                      key={feature.title}
                      className="rounded-[1.5rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5 shadow-[0_18px_42px_rgba(2,8,23,0.16)] transition hover:-translate-y-0.5 hover:bg-[rgba(255,255,255,0.06)]"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-[0_10px_24px_rgba(255,255,255,0.12)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-white">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/64">{feature.description}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
