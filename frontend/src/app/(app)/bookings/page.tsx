import { BookingManagementPage } from "@/components/bookings/BookingManagementPage";
import { requireRole } from "@/lib/auth/session";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const user = await requireRole(["STUDENT", "ADMIN"]);
  const resolvedSearchParams = await searchParams;
  const bookingId = Number(resolvedSearchParams.bookingId);

  return (
    <BookingManagementPage
      user={user}
      initialHighlightedBookingId={Number.isFinite(bookingId) ? bookingId : null}
    />
  );
}
 
