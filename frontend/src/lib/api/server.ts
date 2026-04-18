import { headers } from "next/headers";

import { getFrontendApiBaseUrl } from "@/lib/config/env";

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

function getRequestOrigin(requestHeaders: Headers) {
  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) {
    return null;
  }

  return `${forwardedProto ?? "http"}://${host}`;
}

export async function serverApiFetch(path: string, init: RequestInit = {}) {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie");
  const apiBaseUrl = getFrontendApiBaseUrl();
  const requestOrigin = getRequestOrigin(requestHeaders);
  const targetUrl =
    apiBaseUrl.startsWith("/") && requestOrigin
      ? `${requestOrigin}${apiBaseUrl}${path}`
      : `${apiBaseUrl}${path}`;

  return fetch(targetUrl, {
    ...init,
    cache: "no-store",
    redirect: "manual",
    headers: withDefaultHeaders(init.headers, {
      Accept: "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    }),
  });
}
