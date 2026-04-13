import { serverApiFetch } from "@/lib/api/server";
import { buildUserQuery, throwUserApiError } from "@/lib/users/shared";
import type { AdminUserDetail, AdminUserSummary, UserFilters } from "@/lib/users/types";

export async function listUsersServer(filters: UserFilters = {}) {
  const response = await serverApiFetch(`/api/v1/users${buildUserQuery(filters)}`);
  if (!response.ok) await throwUserApiError(response);
  return ((await response.json()) as AdminUserSummary[]) ?? [];
}

export async function getUserDetailServer(id: number) {
  const response = await serverApiFetch(`/api/v1/users/${id}`);
  if (!response.ok) await throwUserApiError(response);
  return (await response.json()) as AdminUserDetail;
}
