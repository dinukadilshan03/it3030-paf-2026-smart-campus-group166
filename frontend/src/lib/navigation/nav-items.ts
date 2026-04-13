import type { NavItem, RoleCode } from "@/types/auth";

const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    roles: ["STUDENT", "STAFF", "ADMIN"],
  },
  {
    title: "Resources",
    href: "/resources",
    roles: ["STUDENT", "STAFF", "ADMIN"],
  },
  {
    title: "Bookings",
    href: "/bookings",
    roles: ["STUDENT", "ADMIN"],
  },
  {
    title: "Tickets",
    href: "/tickets",
    roles: ["STUDENT", "STAFF", "ADMIN"],
  },
  {
    title: "Users",
    href: "/users",
    roles: ["ADMIN"],
  },
  {
    title: "Notifications",
    href: "/notifications",
    roles: ["ADMIN"],
  },
];

export function getNavigationForRole(role: RoleCode | null) {
  if (!role) {
    return [];
  }

  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
