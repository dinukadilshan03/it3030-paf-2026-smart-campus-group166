import { AdminAnalyticsWorkspace } from "@/components/admin-analytics/AdminAnalyticsWorkspace";
import {
  getAdminAnalyticsChartsServer,
  getAdminAnalyticsHealthServer,
  getAdminAnalyticsInsightsServer,
  getAdminAnalyticsOverviewServer,
} from "@/lib/admin-analytics/server";
import { requireRole } from "@/lib/auth/session";

export default async function AnalyticsPage() {
  await requireRole(["ADMIN"]);

  const [overview, charts, health, insights] = await Promise.all([
    getAdminAnalyticsOverviewServer("30D"),
    getAdminAnalyticsChartsServer("30D"),
    getAdminAnalyticsHealthServer("30D"),
    getAdminAnalyticsInsightsServer("30D"),
  ]);

  return (
    <AdminAnalyticsWorkspace
      initialRange="30D"
      initialOverview={overview}
      initialCharts={charts}
      initialHealth={health}
      initialInsights={insights}
    />
  );
}
