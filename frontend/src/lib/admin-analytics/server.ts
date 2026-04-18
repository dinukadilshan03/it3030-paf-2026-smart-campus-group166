import { serverApiFetch } from "@/lib/api/server";
import type {
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

export async function getAdminAnalyticsOverviewServer(range: AnalyticsRange) {
  const response = await serverApiFetch(`/api/v1/admin/analytics/overview?range=${range}`);
  await ensureOk(response, "Could not load the analytics overview.");
  return (await response.json()) as AdminAnalyticsOverview;
}

export async function getAdminAnalyticsChartsServer(range: AnalyticsRange) {
  const response = await serverApiFetch(`/api/v1/admin/analytics/charts?range=${range}`);
  await ensureOk(response, "Could not load analytics charts.");
  return (await response.json()) as AdminAnalyticsChartBundle;
}

export async function getAdminAnalyticsHealthServer(range: AnalyticsRange) {
  const response = await serverApiFetch(`/api/v1/admin/analytics/health?range=${range}`);
  await ensureOk(response, "Could not load analytics health metrics.");
  return (await response.json()) as AdminAnalyticsHealth;
}

export async function getAdminAnalyticsInsightsServer(range: AnalyticsRange) {
  const response = await serverApiFetch("/api/v1/admin/analytics/insights", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ range }),
  });
  await ensureOk(response, "Could not generate analytics insights.");
  return (await response.json()) as AdminAnalyticsInsightResponse;
}
