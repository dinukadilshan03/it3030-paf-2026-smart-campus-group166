const DEFAULT_API_BASE_URL = "http://localhost:8080";
const DEFAULT_BACKEND_PROXY_PATH = "/backend";

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/$/, "");
}

function isLocalBackendUrl(value: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value);
}

export function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return normalizeBaseUrl(configuredUrl || DEFAULT_API_BASE_URL);
}

export function getFrontendApiBaseUrl() {
  const backendOrigin = getApiBaseUrl();

  if (isLocalBackendUrl(backendOrigin)) {
    return backendOrigin;
  }

  return DEFAULT_BACKEND_PROXY_PATH;
}

export function getBackendOAuthUrl() {
  return `${getApiBaseUrl()}/oauth2/authorization/google`;
}
