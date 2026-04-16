import { headers } from "next/headers";
import type { BookingFilters } from "@/lib/bookings/types";
import { getApiBaseUrl } from "@/lib/config/env";

function withDefaultHeaders(
  inputHeaders: HeadersInit | undefined,
  extraHeaders: Record<string, string>,
) {
  const mergedHeaders = new Headers(inputHeaders);

  Object.entries(extraHeaders).forEach(([key, value]) => {
    if (value) {
      mergedHeaders.set(key, value);
    }
  });

  return mergedHeaders;
}

export async function serverApiFetch(path: string, init: RequestInit = {}) {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie");

  return fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    redirect: "manual",
    headers: withDefaultHeaders(init.headers, {
      Accept: "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    }),
  });
}
