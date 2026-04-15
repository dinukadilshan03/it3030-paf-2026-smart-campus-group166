import { clientApiFetch } from "@/lib/api/client";
import { throwProfileApiError } from "@/lib/profile/shared";
import type { Profile, UpdateProfileRequest } from "@/lib/profile/types";

export async function getProfileClient() {
  const response = await clientApiFetch("/api/v1/profile", { cache: "no-store" });
  if (!response.ok) await throwProfileApiError(response);
  return (await response.json()) as Profile;
}

export async function updateProfileClient(payload: UpdateProfileRequest) {
  const response = await clientApiFetch("/api/v1/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await throwProfileApiError(response);
  return (await response.json()) as Profile;
}
