import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { requireRole } from "@/lib/auth/session";

export default async function UsersPage() {
  await requireRole(["ADMIN"]);

  return (
    <PagePlaceholder
      eyebrow="Admin workflow"
      title="Users"
      description="This placeholder page is reserved for admin user management, role changes, and account status controls."
    />
  );
}
