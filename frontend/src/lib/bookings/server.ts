import { headers } from "next/headers";

import { getApiBaseUrl } from "@/lib/config/env";
function buildBookingParams(filters: BookingFilters = {}): URLSearchParams {
  const params = new URLSearchParams();

  
  if (filters.status) {
    params.append("status", filters.status);
  }

  
  if (filters.resourceId != null) {
    params.append("resourceId", String(filters.resourceId));
  }

  if (filters.requesterUserId != null) {
    params.append("requesterUserId", String(filters.requesterUserId));
  }

  
  if (filters.bookingDate) {
    params.append("bookingDate", filters.bookingDate);
  }

  return params;
}

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
