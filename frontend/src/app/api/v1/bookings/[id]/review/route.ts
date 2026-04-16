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
    console.log("[REVIEW] Raw params:", params);
    const bookingId = params.id;
    console.log("[REVIEW] bookingId:", bookingId);
    if (!bookingId) {
      console.error("[REVIEW] bookingId is missing/undefined");
      return NextResponse.json(
        { message: "Booking ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json() as { decision: string; reason?: string };

    if (!body.decision || !["APPROVE", "REJECT"].includes(body.decision)) {
      return NextResponse.json(
        { message: "Invalid decision. Must be APPROVE or REJECT." },
        { status: 400 }
      );
    }

    // Build request body to send to backend
    const requestBody: Record<string, unknown> = {
      decision: body.decision,
    };
    if (body.reason && body.reason.trim()) {
      requestBody.reason = body.reason;
    }

    console.log("[REVIEW] Sending request to backend:", {
      bookingId,
      body: requestBody,
    });

    const response = await serverApiFetch(
      `/api/v1/bookings/${bookingId}/review`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    const responseText = await response.text();
    console.log("[REVIEW] Backend response:", {
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
      responseData = { message: "Booking review completed successfully" };
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[REVIEW] Error reviewing booking:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to review booking",
      },
      { status: 500 }
    );
  }
}
