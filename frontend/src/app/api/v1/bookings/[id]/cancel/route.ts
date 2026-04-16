import { serverApiFetch } from "@/lib/api/server";
import type { ApiErrorResponse } from "@/lib/bookings/types";
import { NextResponse } from "next/server";

export async function PATCH(
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

    const body = (await request.json()) as { reason?: string };

    // Build request body to send to backend
    const requestBody: Record<string, unknown> = {};
    if (body.reason && body.reason.trim()) {
      requestBody.reason = body.reason;
    }

    console.log("[CANCEL] Sending request to backend:", {
      bookingId,
      body: requestBody,
    });

    const response = await serverApiFetch(
      `/api/v1/bookings/${bookingId}/cancel`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    const responseText = await response.text();
    console.log("[CANCEL] Backend response:", {
      status: response.status,
      statusText: response.statusText,
      body: responseText,
    });

    if (!response.ok) {
      let message = `API Error: ${response.status} ${response.statusText}`;
      try {
        const error = JSON.parse(responseText) as ApiErrorResponse;
        if (error.message) message = error.message;
      } catch { /* use responseText as fallback */ }
      return NextResponse.json({ message }, { status: response.status });
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: "Booking cancelled successfully" };
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[CANCEL] Error cancelling booking:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to cancel booking",
      },
      { status: 500 }
    );
  }
}
