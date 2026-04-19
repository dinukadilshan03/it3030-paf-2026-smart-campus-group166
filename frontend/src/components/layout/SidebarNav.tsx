"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavItem } from "@/types/auth";

type SidebarNavProps = {
  items: NavItem[];
  orientation?: "horizontal" | "vertical";
};

function isItemActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  items,
  orientation = "vertical",
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={
        orientation === "horizontal"
          ? "flex gap-2 overflow-x-auto pb-1"
          : "flex flex-col gap-2"
      }
      aria-label="Primary"
    >
      {items.map((item) => {
        const active = isItemActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            style={active ? { color: "var(--surface-strong)" } : undefined}
            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
              active
                ? "bg-stone-900 font-semibold text-white shadow-[0_16px_34px_rgba(38,33,28,0.16)]"
                : "text-stone-700 hover:bg-white hover:text-stone-900 visited:text-stone-700"
            }`}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
