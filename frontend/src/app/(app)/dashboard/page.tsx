import { AdminDashboardPage } from "@/components/admin-analytics/AdminDashboardPage";
import { RoleDashboard } from "@/components/dashboard/RoleDashboard";
import {
  getAdminAnalyticsInsightsServer,
  getAdminAnalyticsOverviewServer,
} from "@/lib/admin-analytics/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { getDashboardDefinition } from "@/lib/navigation/dashboard-config";

export default async function DashboardPage() {
  const user = await requireCurrentUser();

  if (!user.role) {
    return null;
  }

  if (user.role === "ADMIN") {
    const [overview, insights] = await Promise.all([
      getAdminAnalyticsOverviewServer("30D"),
      getAdminAnalyticsInsightsServer("30D"),
    ]);

    return (
      <AdminDashboardPage
        overview={overview}
        insights={insights}
        displayName={user.displayName || user.email || "SmartCampus admin"}
      />
    );
  }

  return <RoleDashboard user={user} definition={getDashboardDefinition(user.role)} />;
}
