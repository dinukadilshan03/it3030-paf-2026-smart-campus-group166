import { BookingManagementPage } from "@/components/bookings/BookingManagementPage";
import { requireRole } from "@/lib/auth/session";

export default async function BookingsPage() {
  const user = await requireRole(["ADMIN"]);

  return <BookingManagementPage user={user} />;
}
 