import { TicketWorkspacePage } from "@/components/tickets/TicketWorkspacePage";
import { requireRole } from "@/lib/auth/session";
import {
  getTicketBundleServer,
  listAssignableStaffServer,
  listTicketCategoriesServer,
  listTicketLocationsServer,
  listTicketReporterUsersServer,
  listTicketResourcesServer,
  listTicketsServer,
} from "@/lib/tickets/server";

export default async function TicketsPage() {
  const currentUser = await requireRole(["STUDENT", "STAFF", "ADMIN"]);

  const [tickets, categories, locations, resources, activeStaffUsers, reporterUsers] = await Promise.all([
    listTicketsServer(),
    listTicketCategoriesServer(),
    listTicketLocationsServer(),
    listTicketResourcesServer(),
    currentUser.role === "ADMIN" ? listAssignableStaffServer() : Promise.resolve([]),
    currentUser.role === "ADMIN" ? listTicketReporterUsersServer() : Promise.resolve([]),
  ]);

  const initialSelectedBundle =
    tickets.length > 0 ? await getTicketBundleServer(tickets[0].id) : null;

  return (
    <TicketWorkspacePage
      currentUser={currentUser}
      initialTickets={tickets}
      initialCategories={categories}
      initialLocations={locations}
      initialResources={resources}
      initialStaffUsers={activeStaffUsers}
      initialReporterUsers={reporterUsers}
      initialSelectedBundle={initialSelectedBundle}
    />
  );
}
