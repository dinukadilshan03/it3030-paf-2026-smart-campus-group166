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

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ ticketId?: string }>;
}) {
  const currentUser = await requireRole(["STUDENT", "STAFF", "ADMIN"]);
  const resolvedSearchParams = await searchParams;
  const requestedTicketId = Number(resolvedSearchParams.ticketId);

  const [tickets, categories, locations, resources, activeStaffUsers, reporterUsers] = await Promise.all([
    listTicketsServer(),
    listTicketCategoriesServer(),
    listTicketLocationsServer(),
    listTicketResourcesServer(),
    currentUser.role === "ADMIN" ? listAssignableStaffServer() : Promise.resolve([]),
    currentUser.role === "ADMIN" ? listTicketReporterUsersServer() : Promise.resolve([]),
  ]);

  const selectedTicketId =
    Number.isFinite(requestedTicketId) && tickets.some((ticket) => ticket.id === requestedTicketId)
      ? requestedTicketId
      : tickets[0]?.id;
  const initialSelectedBundle =
    selectedTicketId != null ? await getTicketBundleServer(selectedTicketId) : null;

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
