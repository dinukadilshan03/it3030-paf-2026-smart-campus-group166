import type { DashboardCard, DashboardDefinition, RoleCode } from "@/types/auth";

const DASHBOARD_CARDS: Record<RoleCode, DashboardCard[]> = {
  STUDENT: [
    {
      title: "Bookings",
      href: "/bookings",
      description: "Request spaces, track approvals, and review your booking activity.",
      roles: ["STUDENT"],
    },
    {
      title: "Tickets",
      href: "/tickets",
      description: "Report issues, follow updates, and keep maintenance requests moving.",
      roles: ["STUDENT"],
    },
    {
      title: "Resources",
      href: "/resources",
      description: "Browse available locations and managed campus resources.",
      roles: ["STUDENT"],
    },
    {
      title: "Profile",
      href: "/profile",
      description: "View your account area and the profile scaffold your team can expand later.",
      roles: ["STUDENT"],
    },
    {
      title: "Notifications",
      href: "/notifications",
      description: "Track booking decisions, ticket updates, and new comments.",
      roles: ["STUDENT"],
    },
  ],
  STAFF: [
    {
      title: "Tickets",
      href: "/tickets",
      description: "Open assigned support work and track the service workflow from one place.",
      roles: ["STAFF"],
    },
    {
      title: "Resources",
      href: "/resources",
      description: "Browse managed resources that support operations and issue resolution.",
      roles: ["STAFF"],
    },
    {
      title: "Profile",
      href: "/profile",
      description: "Access your personal profile placeholder and future account settings area.",
      roles: ["STAFF"],
    },
    {
      title: "Notifications",
      href: "/notifications",
      description: "Review ticket updates and new comments tied to your work.",
      roles: ["STAFF"],
    },
  ],
  ADMIN: [
    {
      title: "User Management",
      href: "/users",
      description: "Manage platform access, roles, and account status for all users.",
      roles: ["ADMIN"],
    },
    {
      title: "Ticket Management",
      href: "/tickets",
      description: "Oversee ticket creation, assignment, and lifecycle management.",
      roles: ["ADMIN"],
    },
    {
      title: "Booking Management",
      href: "/bookings",
      description: "Review booking activity and move into approval and cancellation flows.",
      roles: ["ADMIN"],
    },
    {
      title: "Resource Management",
      href: "/resources",
      description: "Maintain categories, locations, resources, and availability structures.",
      roles: ["ADMIN"],
    },
    {
      title: "Analytics",
      href: "/analytics",
      description: "Inspect usage analytics, auth health, and AI-generated operational insights.",
      roles: ["ADMIN"],
    },
    {
      title: "Notifications",
      href: "/notifications",
      description: "Review booking decisions, ticket updates, and new comments.",
      roles: ["ADMIN"],
    },
    {
      title: "Profile",
      href: "/profile",
      description: "Use the shared profile scaffold for personal account presentation.",
      roles: ["ADMIN"],
    },
  ],
};

const DASHBOARD_DEFINITIONS: Record<RoleCode, DashboardDefinition> = {
  STUDENT: {
    badge: "Student dashboard",
    heading: "Student workspace",
    description:
      "This dashboard acts as the student landing page and connects directly to the pages your teammates will build next.",
    cards: DASHBOARD_CARDS.STUDENT,
  },
  STAFF: {
    badge: "Staff dashboard",
    heading: "Staff workspace",
    description:
      "This dashboard gives staff a clean support-focused entry point with direct navigation into tickets, resources, and account scaffolding.",
    cards: DASHBOARD_CARDS.STAFF,
  },
  ADMIN: {
    badge: "Admin dashboard",
    heading: "Admin workspace",
    description:
      "This dashboard is the admin command center for management workflows, with placeholder links to every authorized operational area.",
    cards: DASHBOARD_CARDS.ADMIN,
  },
};

export function getDashboardDefinition(role: RoleCode) {
  return DASHBOARD_DEFINITIONS[role];
}
