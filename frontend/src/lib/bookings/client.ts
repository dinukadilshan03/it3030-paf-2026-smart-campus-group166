import { frontendRouteFetch } from "@/lib/api/client";
import type {
  BookingDetailResponse,
  BookingFilters,
  BookingSummaryResponse,
  CancelBookingRequest,
  ReviewBookingRequest,
  ApiErrorResponse,
  CreateBookingRequest,
} from "@/lib/bookings/types";

function buildBookingParams(filters: BookingFilters = {}): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.status !== undefined && filters.status !== "") {
    params.append("status", filters.status);
  }
  if (filters.resourceId !== undefined && filters.resourceId !== "") {
    params.append("resourceId", String(filters.resourceId));
  }
  if (filters.requesterUserId !== undefined && filters.requesterUserId !== "") {
    params.append("requesterUserId", String(filters.requesterUserId));
  }
  if (filters.bookingDate) {
    params.append("bookingDate", filters.bookingDate);
  }

  return params;
}

async function throwBookingApiError(response: Response): Promise<never> {
  let message = `API Error: ${response.status} ${response.statusText}`;

  try {
    const error = (await response.json()) as ApiErrorResponse;
    if (error.message) {
      message = error.message;
    }
  } catch {
    // continue with default message
  }

  throw new Error(message);
}

export async function listBookingsClient(filters: BookingFilters = {}) {
  const params = buildBookingParams(filters);
  const queryString = params.toString();
  const url = `/api/v1/bookings${queryString ? `?${queryString}` : ""}`;

  const response = await frontendRouteFetch(url, { cache: "no-store" });
  if (!response.ok) await throwBookingApiError(response);

  return ((await response.json()) as BookingSummaryResponse[]) ?? [];
}

export async function getBookingDetailClient(id: number) {
  const response = await frontendRouteFetch(`/api/v1/bookings/${id}`, {
    cache: "no-store",
  });
  if (!response.ok) await throwBookingApiError(response);

  return (await response.json()) as BookingDetailResponse;
}

export async function createBookingClient(request: CreateBookingRequest) {
  const response = await frontendRouteFetch("/api/v1/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) await throwBookingApiError(response);

  return (await response.json()) as BookingDetailResponse;
}

export async function reviewBookingClient(id: number, request: ReviewBookingRequest) {
  const response = await frontendRouteFetch(`/api/v1/bookings/${id}/review`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) await throwBookingApiError(response);

  return (await response.json()) as BookingDetailResponse;
}

export async function cancelBookingClient(id: number, request?: CancelBookingRequest) {
  const response = await frontendRouteFetch(`/api/v1/bookings/${id}/cancel`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: request ? JSON.stringify(request) : undefined,
  });

  if (!response.ok) await throwBookingApiError(response);

  return (await response.json()) as BookingDetailResponse;
}

export async function deleteBookingClient(id: number, request?: CancelBookingRequest) {
  const response = await frontendRouteFetch(`/api/v1/bookings/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: request ? JSON.stringify(request) : undefined,
  });

  if (!response.ok) await throwBookingApiError(response);
}
