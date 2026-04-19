import type { DashboardDefinition, RoleCode } from "@/types/auth";

const DASHBOARD_DEFINITIONS: Record<RoleCode, DashboardDefinition> = {
  STUDENT: {
    sections: [
      {
        type: "hero",
        eyebrow: "Student workspace",
        title: "Stay on top of campus requests without hunting for the next step.",
        description:
          "This dashboard is built as a daily action hub for bookings, support, and updates so students can move through the platform quickly.",
        cta: {
          label: "Open bookings",
          href: "/bookings",
        },
        secondaryCta: {
          label: "View notifications",
          href: "/notifications",
        },
      },
      {
        type: "metrics",
        items: [
          {
            label: "Primary workspace",
            value: "Bookings",
            detail: "Create requests, review status changes, and revisit recent reservations.",
            href: "/bookings",
          },
          {
            label: "Support channel",
            value: "Tickets",
            detail: "Report issues and track replies without leaving the dashboard flow.",
            href: "/tickets",
          },
          {
            label: "Shared visibility",
            value: "Notifications",
            detail: "Keep approvals, ticket updates, and comments visible in one place.",
            href: "/notifications",
          },
        ],
      },
      {
        type: "primaryActions",
        title: "Start something quickly",
        description: "Lead with the actions students are most likely to take first.",
        placement: "main",
        items: [
          {
            eyebrow: "Bookings",
            title: "Manage booking requests",
            description: "Open your booking area to request a space, check approvals, or revisit upcoming use.",
            href: "/bookings",
            meta: "Request, review, and follow status",
          },
          {
            eyebrow: "Support",
            title: "Raise or follow an issue",
            description: "Go straight into tickets to report a problem or check progress on an open request.",
            href: "/tickets",
            meta: "Issue intake and update tracking",
          },
        ],
      },
      {
        type: "activity",
        title: "Recent visibility",
        description: "A concise view of the parts of the platform students return to most often.",
        placement: "main",
        items: [
          {
            eyebrow: "Notifications",
            title: "Review your latest updates",
            description: "See booking decisions, ticket replies, and new comments in the shared notification history.",
            href: "/notifications",
            meta: "Best place to catch up quickly",
            tone: "accent",
          },
          {
            eyebrow: "Resources",
            title: "Browse available resources",
            description: "Explore spaces and managed resources before starting a booking request.",
            href: "/resources",
            meta: "Check availability context",
          },
        ],
      },
      {
        type: "secondaryPanels",
        placement: "rail",
        panels: [
          {
            title: "Keep close",
            description: "Shortcut areas that support the student journey without crowding the main column.",
            items: [
              {
                title: "Resources catalog",
                description: "Browse spaces and campus resources.",
                href: "/resources",
                eyebrow: "Reference",
              },
              {
                title: "Profile and account",
                description: "Review your shared account area and profile details.",
                href: "/profile",
                eyebrow: "Account",
              },
            ],
          },
          {
            title: "Flow notes",
            items: [
              {
                title: "Bookings stay task-first",
                description: "The dashboard points toward action and status rather than analytics-heavy widgets.",
                href: "/bookings",
                tone: "muted",
              },
            ],
          },
        ],
      },
    ],
  },
  STAFF: {
    sections: [
      {
        type: "hero",
        eyebrow: "Staff workspace",
        title: "Run support and operational follow-through from one structured workspace.",
        description:
          "The staff dashboard prioritizes issue handling, resource context, and fast access to the work that moves campus operations forward.",
        cta: {
          label: "Open tickets",
          href: "/tickets",
        },
        secondaryCta: {
          label: "Browse resources",
          href: "/resources",
        },
      },
      {
        type: "metrics",
        items: [
          {
            label: "Core responsibility",
            value: "Ticket flow",
            detail: "Review, triage, and continue issue handling from the support workspace.",
            href: "/tickets",
          },
          {
            label: "Operational context",
            value: "Resources",
            detail: "Use resource data to support service decisions and day-to-day coordination.",
            href: "/resources",
          },
          {
            label: "Shared updates",
            value: "Notifications",
            detail: "Track comments, status changes, and system-generated follow-up signals.",
            href: "/notifications",
          },
        ],
      },
      {
        type: "primaryActions",
        title: "Operational priorities",
        description: "The main column should feel like a work queue rather than a gallery of cards.",
        placement: "main",
        items: [
          {
            eyebrow: "Support",
            title: "Continue ticket handling",
            description: "Move directly into issue tracking, assignment follow-up, and support coordination.",
            href: "/tickets",
            meta: "Primary staff workspace",
          },
          {
            eyebrow: "Resources",
            title: "Check managed resources",
            description: "Use current resource and location context to support service resolution and requests.",
            href: "/resources",
            meta: "Reference for operational work",
          },
        ],
      },
      {
        type: "lists",
        title: "Support and visibility",
        description: "Secondary work streams that still matter during day-to-day operations.",
        placement: "main",
        columns: 2,
        items: [
          {
            title: "Notification history",
            description: "Review the latest ticket activity and comment trails tied to your work.",
            href: "/notifications",
            eyebrow: "Updates",
          },
          {
            title: "Profile and access",
            description: "Open the shared account area used across protected pages.",
            href: "/profile",
            eyebrow: "Account",
          },
        ],
      },
      {
        type: "alerts",
        title: "Staff guidance",
        description: "Keep the rail focused on attention and workflow, not decoration.",
        placement: "rail",
        items: [
          {
            title: "Start in tickets first",
            description: "This dashboard is intentionally centered on support flow and operational follow-through.",
            href: "/tickets",
            tone: "warning",
          },
          {
            title: "Use resources as context",
            description: "Resource data supports staff decisions, but should not outrank current issue handling.",
            href: "/resources",
            tone: "muted",
          },
        ],
      },
    ],
  },
  ADMIN: {
    sections: [
      {
        type: "hero",
        eyebrow: "Admin dashboard",
        title: "Campus command center",
        description:
          "Use a structured management view to move between platform oversight, operational pressure, and deeper analytics.",
        cta: {
          label: "Open analytics",
          href: "/analytics",
        },
        secondaryCta: {
          label: "Review users",
          href: "/users",
        },
      },
    ],
  },
};

export function getDashboardDefinition(role: RoleCode) {
  return DASHBOARD_DEFINITIONS[role];
}
