import { UserManagementPage } from "@/components/users/UserManagementPage";
import { requireRole } from "@/lib/auth/session";
import { getUserDetailServer, listUsersServer } from "@/lib/users/server";

export default async function UsersPage() {
  await requireRole(["ADMIN"]);
  const users = await listUsersServer();
  const selectedUser = users.length > 0 ? await getUserDetailServer(users[0].id) : null;

  return <UserManagementPage initialUsers={users} initialSelectedUser={selectedUser} />;
}
