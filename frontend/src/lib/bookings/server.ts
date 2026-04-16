import { serverApiFetch } from "@/lib/api/server";
import type {
  BookingDetailResponse,
  BookingFilters,
  BookingSummaryResponse,
  CancelBookingRequest,
  ReviewBookingRequest,
  ApiErrorResponse,
} from "@/lib/bookings/types";

function buildBookingParams(filters: BookingFilters = {}): URLSearchParams {
  const params = new URLSearchParams();
  
  if (filters.status) {
    params.append("status", filters.status);
  }
  if (filters.resourceId) {
    params.append("resourceId", String(filters.resourceId));
  }
  if (filters.requesterUserId) {
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

export async function listBookingsServer(filters: BookingFilters = {}) {
  const params = buildBookingParams(filters);
  const queryString = params.toString();
  const url = `/api/v1/bookings${queryString ? `?${queryString}` : ""}`;
  
  const response = await serverApiFetch(url);
  if (!response.ok) await throwBookingApiError(response);
  
  return ((await response.json()) as BookingSummaryResponse[]) ?? [];
}

export async function getBookingDetailServer(id: number) {
  const response = await serverApiFetch(`/api/v1/bookings/${id}`);
  if (!response.ok) await throwBookingApiError(response);
  
  return (await response.json()) as BookingDetailResponse;
}

export async function reviewBookingServer(id: number, request: ReviewBookingRequest) {
  const response = await serverApiFetch(`/api/v1/bookings/${id}/review`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) await throwBookingApiError(response);
  
  return (await response.json()) as BookingDetailResponse;
}

export async function cancelBookingServer(id: number, request?: CancelBookingRequest) {
  const response = await serverApiFetch(`/api/v1/bookings/${id}/cancel`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: request ? JSON.stringify(request) : undefined,
  });
  
  if (!response.ok) await throwBookingApiError(response);
  
  return (await response.json()) as BookingDetailResponse;
}
