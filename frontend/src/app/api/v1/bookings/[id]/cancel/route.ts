import { getApiBaseUrl } from "@/lib/config/env";
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

    // Extract auth headers from incoming request
    const cookie = request.headers.get("cookie");
    const authorization = request.headers.get("authorization");

    console.log("[CANCEL] Sending request to backend:", {
      bookingId,
      body: requestBody,
      hasCookie: !!cookie,
      hasAuthorization: !!authorization,
    });

    // Forward request to backend with auth headers
    const response = await fetch(
      `${getApiBaseUrl()}/api/v1/bookings/${bookingId}/cancel`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(cookie ? { Cookie: cookie } : {}),
          ...(authorization ? { Authorization: authorization } : {}),
        },
        body: JSON.stringify(requestBody),
        cache: "no-store",
        redirect: "manual",
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
