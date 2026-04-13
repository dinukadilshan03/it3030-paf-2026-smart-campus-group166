import { RoleDashboard } from "@/components/dashboard/RoleDashboard";
import { requireCurrentUser } from "@/lib/auth/session";
import { getDashboardDefinition } from "@/lib/navigation/dashboard-config";

export default async function DashboardPage() {
  const user = await requireCurrentUser();

  if (!user.role) {
    return null;
  }

  return <RoleDashboard user={user} definition={getDashboardDefinition(user.role)} />;
}
