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

export async function clientApiFetch(path: string, init: RequestInit = {}) {
  return fetch(`${getFrontendApiBaseUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers: withDefaultHeaders(init.headers, {
      Accept: "application/json",
    }),
  });
}

export async function frontendRouteFetch(path: string, init: RequestInit = {}) {
  return fetch(path, {
    ...init,
    credentials: "include",
    headers: withDefaultHeaders(init.headers, {
      Accept: "application/json",
    }),
  });
}
