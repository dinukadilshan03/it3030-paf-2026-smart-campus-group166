import { clientApiFetch } from "@/lib/api/client";
import { buildUserQuery, throwUserApiError } from "@/lib/users/shared";
import type {
  AdminUserDetail,
  AdminUserSummary,
  CreateLocalCredentialsRequest,
  CreateUserRequest,
  ResetLocalPasswordRequest,
  UpdateUserRequest,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
  UserFilters,
} from "@/lib/users/types";

export async function listUsersClient(filters: UserFilters = {}) {
  const response = await clientApiFetch(`/api/v1/users${buildUserQuery(filters)}`, {
    cache: "no-store",
  });
  if (!response.ok) await throwUserApiError(response);
  return ((await response.json()) as AdminUserSummary[]) ?? [];
}

export async function getUserDetailClient(id: number) {
  const response = await clientApiFetch(`/api/v1/users/${id}`, { cache: "no-store" });
  if (!response.ok) await throwUserApiError(response);
  return (await response.json()) as AdminUserDetail;
}

async function sendJson<TResponse>(path: string, method: string, body?: object) {
  const response = await clientApiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) await throwUserApiError(response);
  return (await response.json()) as TResponse;
}

export function createUserClient(payload: CreateUserRequest) {
  return sendJson<AdminUserDetail>("/api/v1/users", "POST", payload);
}

export function updateUserClient(id: number, payload: UpdateUserRequest) {
  return sendJson<AdminUserDetail>(`/api/v1/users/${id}`, "PATCH", payload);
}

export function updateUserRoleClient(id: number, payload: UpdateUserRoleRequest) {
  return sendJson<AdminUserDetail>(`/api/v1/users/${id}/role`, "PATCH", payload);
}

export function updateUserStatusClient(id: number, payload: UpdateUserStatusRequest) {
  return sendJson<AdminUserDetail>(`/api/v1/users/${id}/status`, "PATCH", payload);
}

export function createLocalCredentialsClient(
  id: number,
  payload: CreateLocalCredentialsRequest,
) {
  return sendJson<AdminUserDetail>(`/api/v1/users/${id}/local-credentials`, "POST", payload);
}

export function resetLocalPasswordClient(
  id: number,
  payload: ResetLocalPasswordRequest,
) {
  return sendJson<AdminUserDetail>(
    `/api/v1/users/${id}/local-credentials/reset-password`,
    "PATCH",
    payload,
  );
}

export function deleteLocalCredentialsClient(id: number) {
  return sendJson<AdminUserDetail>(`/api/v1/users/${id}/local-credentials`, "DELETE");
}
