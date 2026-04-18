import type { NavItem, RoleCode } from "@/types/auth";

const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    roles: ["STUDENT", "STAFF", "ADMIN"],
    description: "Role-based landing page",
  },
  {
    title: "Resources",
    href: "/resources",
    roles: ["STUDENT", "STAFF", "ADMIN"],
    description: "Resource browsing and management",
  },
  {
    title: "Bookings",
    href: "/bookings",
    roles: ["STUDENT", "ADMIN"],
    description: "Booking requests and management",
  },
  {
    title: "Tickets",
    href: "/tickets",
    roles: ["STUDENT", "STAFF", "ADMIN"],
    description: "Ticket reporting and support flow",
  },
  {
    title: "Users",
    href: "/users",
    roles: ["ADMIN"],
    description: "Admin user management",
  },
  {
    title: "Notifications",
    href: "/notifications",
    roles: ["STUDENT", "STAFF", "ADMIN"],
    description: "In-app notification history",
  },
  {
    title: "Profile",
    href: "/profile",
    roles: ["STUDENT", "STAFF", "ADMIN"],
    description: "Shared account area",
  },
];

export function getNavigationForRole(role: RoleCode | null) {
  if (!role) {
    return [];
  }

  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
