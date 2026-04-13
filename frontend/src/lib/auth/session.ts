import { redirect } from "next/navigation";

import { serverApiFetch } from "@/lib/api/server";
import type { AuthApiError, CurrentUser, RoleCode } from "@/types/auth";

const ANONYMOUS_USER: CurrentUser = {
  authenticated: false,
  id: null,
  email: null,
  displayName: null,
  role: null,
  status: null,
};

type CurrentUserResult =
  | { kind: "authenticated"; user: CurrentUser }
  | { kind: "anonymous"; user: CurrentUser }
  | { kind: "error"; error: AuthApiError; user: CurrentUser };

async function getCurrentUserResult(): Promise<CurrentUserResult> {
  try {
    const response = await serverApiFetch("/api/v1/auth/me");

    if (response.ok) {
      const user = (await response.json()) as CurrentUser;
      if (user.authenticated) {
        return { kind: "authenticated", user };
      }
      return { kind: "anonymous", user: ANONYMOUS_USER };
    }

    const apiError = (await response.json().catch(() => null)) as AuthApiError | null;
    if (response.status === 401 && apiError?.code) {
      return { kind: "error", error: apiError, user: ANONYMOUS_USER };
    }

    return { kind: "anonymous", user: ANONYMOUS_USER };
  } catch {
    return { kind: "anonymous", user: ANONYMOUS_USER };
  }
}

export async function getCurrentUser() {
  const result = await getCurrentUserResult();
  return result.user;
}

export async function requireCurrentUser() {
  const result = await getCurrentUserResult();

  if (result.kind === "error") {
    redirect(`/login?error=${result.error.code}`);
  }

  if (result.kind !== "authenticated") {
    redirect("/login");
  }

  return result.user;
}

export async function requireRole(roles: RoleCode[]) {
  const user = await requireCurrentUser();

  if (!user.role || !roles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

export async function redirectIfAuthenticated(destination = "/dashboard") {
  const result = await getCurrentUserResult();

  if (result.kind === "authenticated") {
    redirect(destination);
  }
}
