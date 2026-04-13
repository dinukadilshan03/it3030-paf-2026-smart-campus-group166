import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { requireRole } from "@/lib/auth/session";

export default async function BookingsPage() {
  await requireRole(["STUDENT", "ADMIN"]);

  return (
    <PagePlaceholder
      eyebrow="Booking workflow"
      title="Bookings"
      description="This placeholder page is ready for the booking request, review, and cancellation experience your team will add later."
    />
  );
}
