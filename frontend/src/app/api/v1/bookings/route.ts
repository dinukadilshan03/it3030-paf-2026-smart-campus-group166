import { serverApiFetch } from "@/lib/api/server";
import type { BookingFilters, BookingSummaryResponse, ApiErrorResponse } from "@/lib/bookings/types";
import { NextResponse } from "next/server";

function buildBookingParams(filters: BookingFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.status) params.append("status", filters.status);
  if (filters.resourceId) params.append("resourceId", String(filters.resourceId));
  if (filters.requesterUserId) params.append("requesterUserId", String(filters.requesterUserId));
  if (filters.bookingDate) params.append("bookingDate", filters.bookingDate);

  return params;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: BookingFilters = {};

    const status = searchParams.get("status");
    if (status) {
      filters.status = status as BookingFilters["status"];
    }

    const resourceId = searchParams.get("resourceId");
    if (resourceId) {
      filters.resourceId = parseInt(resourceId, 10);
    }

    const requesterUserId = searchParams.get("requesterUserId");
    if (requesterUserId) {
      filters.requesterUserId = parseInt(requesterUserId, 10);
    }

    const bookingDate = searchParams.get("bookingDate");
    if (bookingDate) {
      filters.bookingDate = bookingDate;
    }

    const params = buildBookingParams(filters);
    const queryString = params.toString();
    const url = `/api/v1/bookings${queryString ? `?${queryString}` : ""}`;

    const response = await serverApiFetch(url);

    if (!response.ok) {
      let message = `API Error: ${response.status} ${response.statusText}`;
      try {
        const error = (await response.json()) as ApiErrorResponse;
        if (error.message) message = error.message;
      } catch { /* use default message */ }
      return NextResponse.json({ message }, { status: response.status });
    }

    const bookings = ((await response.json()) as BookingSummaryResponse[]) ?? [];
    return NextResponse.json(bookings);

  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}