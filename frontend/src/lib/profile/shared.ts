import type { ApiErrorResponse } from "@/lib/profile/types";

async function parseJsonOrNull<T>(response: Response) {
  return (await response.json().catch(() => null)) as T | null;
}

export async function throwProfileApiError(response: Response): Promise<never> {
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
