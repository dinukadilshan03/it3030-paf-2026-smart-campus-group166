import { serverApiFetch } from "@/lib/api/server";
import { throwProfileApiError } from "@/lib/profile/shared";
import type { Profile } from "@/lib/profile/types";

export async function getProfileServer() {
  const response = await serverApiFetch("/api/v1/profile");
  if (!response.ok) await throwProfileApiError(response);
  return (await response.json()) as Profile;
}
