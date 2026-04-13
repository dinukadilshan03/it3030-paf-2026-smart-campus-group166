import { redirect } from "next/navigation";

import { serverApiFetch } from "@/lib/api/server";
import type { CurrentUser, RoleCode } from "@/types/auth";

const ANONYMOUS_USER: CurrentUser = {
  authenticated: false,
  id: null,
  email: null,
  displayName: null,
  role: null,
  status: null,
};

export async function getCurrentUser() {
  try {
    const response = await serverApiFetch("/api/v1/auth/me");

    if (!response.ok) {
      return ANONYMOUS_USER;
    }

    const user = (await response.json()) as CurrentUser;
    return user;
  } catch {
    return ANONYMOUS_USER;
  }
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user.authenticated) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(roles: RoleCode[]) {
  const user = await requireCurrentUser();

  if (!user.role || !roles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

export async function redirectIfAuthenticated(destination = "/dashboard") {
  const user = await getCurrentUser();

  if (user.authenticated) {
    redirect(destination);
  }
}
