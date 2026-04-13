const DEFAULT_API_BASE_URL = "http://localhost:8080";

export function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return (configuredUrl || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

export function getBackendOAuthUrl() {
  return `${getApiBaseUrl()}/oauth2/authorization/google`;
}
