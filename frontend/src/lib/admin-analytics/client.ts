"use client";

import { clientApiFetch } from "@/lib/api/client";
import type {
  AdminAnalyticsAskRequest,
  AdminAnalyticsAskResponse,
  AdminAnalyticsChartBundle,
  AdminAnalyticsHealth,
  AdminAnalyticsInsightResponse,
  AdminAnalyticsOverview,
  AnalyticsRange,
} from "./types";

async function ensureOk(response: Response, message: string) {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message || message);
  }
}

export async function getAdminAnalyticsOverviewClient(range: AnalyticsRange) {
  const response = await clientApiFetch(`/api/v1/admin/analytics/overview?range=${range}`);
  await ensureOk(response, "Could not load the analytics overview.");
  return (await response.json()) as AdminAnalyticsOverview;
}

export async function getAdminAnalyticsChartsClient(range: AnalyticsRange) {
  const response = await clientApiFetch(`/api/v1/admin/analytics/charts?range=${range}`);
  await ensureOk(response, "Could not load analytics charts.");
  return (await response.json()) as AdminAnalyticsChartBundle;
}

export async function getAdminAnalyticsHealthClient(range: AnalyticsRange) {
  const response = await clientApiFetch(`/api/v1/admin/analytics/health?range=${range}`);
  await ensureOk(response, "Could not load analytics health metrics.");
  return (await response.json()) as AdminAnalyticsHealth;
}

export async function getAdminAnalyticsInsightsClient(range: AnalyticsRange) {
  const response = await clientApiFetch("/api/v1/admin/analytics/insights", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ range }),
  });
  await ensureOk(response, "Could not generate analytics insights.");
  return (await response.json()) as AdminAnalyticsInsightResponse;
}

export async function askAdminAnalyticsClient(payload: AdminAnalyticsAskRequest) {
  const response = await clientApiFetch("/api/v1/admin/analytics/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  await ensureOk(response, "Could not answer the analytics question.");
  return (await response.json()) as AdminAnalyticsAskResponse;
}
