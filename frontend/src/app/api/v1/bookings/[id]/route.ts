import { getApiBaseUrl } from "@/lib/config/env";
import type { ApiErrorResponse, BookingSummaryResponse } from "@/lib/bookings/types";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle params that might be a Promise
    const params = await Promise.resolve(context.params);
    const bookingId = params.id;
    if (!bookingId) {
      return NextResponse.json(
        { message: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Extract auth headers from incoming request
    const cookie = request.headers.get("cookie");
    const authorization = request.headers.get("authorization");

    const response = await fetch(`${getApiBaseUrl()}/api/v1/bookings/${bookingId}`, {
      headers: {
        Accept: "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(authorization ? { Authorization: authorization } : {}),
      },
      cache: "no-store",
      redirect: "manual",
    });

    if (!response.ok) {
      let message = `API Error: ${response.status} ${response.statusText}`;
      try {
        const error = (await response.json()) as ApiErrorResponse;
        if (error.message) message = error.message;
      } catch { /* use default message */ }
      return NextResponse.json({ message }, { status: response.status });
    }

    const booking = (await response.json()) as BookingSummaryResponse;
    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to fetch booking",
      },
      { status: 500 }
    );
  }
}
