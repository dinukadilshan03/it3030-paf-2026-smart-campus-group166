import type { ApiErrorResponse, UserFilters } from "@/lib/users/types";

export function buildUserQuery(filters: UserFilters = {}) {
  const params = new URLSearchParams();

  if (filters.role) params.set("role", filters.role);
  if (filters.status) params.set("status", filters.status);
  if (filters.search?.trim()) params.set("search", filters.search.trim());

  const query = params.toString();
  return query ? `?${query}` : "";
}

async function parseJsonOrNull<T>(response: Response) {
  return (await response.json().catch(() => null)) as T | null;
}

export async function throwUserApiError(response: Response): Promise<never> {
  const payload = await parseJsonOrNull<ApiErrorResponse>(response);
  const validationMessage =
    payload?.validationErrors && Object.keys(payload.validationErrors).length > 0
      ? Object.values(payload.validationErrors)[0]
      : null;

  throw new Error(
    validationMessage ||
      payload?.message ||
      payload?.code ||
      `Request failed with status ${response.status}`,
  );
}
