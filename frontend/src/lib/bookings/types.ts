export type BookingStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type BookingSummaryResponse = {
  id: number;
  resourceId: number;
  resourceCode: string;
  resourceName: string;
  requesterUserId: number;
  requesterDisplayName: string;
  bookingDate: string; // ISO date string
  startTime: string; // HH:MM:SS
  endTime: string; // HH:MM:SS
  status: BookingStatus;
  expectedAttendees: number | null;
  createdAt: string; // ISO datetime string
};

export type BookingDetailResponse = {
  id: number;
  resourceId: number;
  resourceCode: string;
  resourceName: string;
  locationId: number;
  locationName: string;
  requesterUserId: number;
  requesterEmail: string;
  requesterDisplayName: string;
  bookingDate: string; // ISO date string
  startTime: string; // HH:MM:SS
  endTime: string; // HH:MM:SS
  purpose: string | null;
  expectedAttendees: number | null;
  requestNotes: string | null;
  status: BookingStatus;
  reviewedByUserId: number | null;
  reviewedByDisplayName: string | null;
  reviewedAt: string | null; // ISO datetime string
  reviewReason: string | null;
  cancelledByUserId: number | null;
  cancelledByDisplayName: string | null;
  cancelledAt: string | null; // ISO datetime string
  cancellationReason: string | null;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
};

export type ReviewBookingRequest = {
  decision: "APPROVE" | "REJECT";
  reason?: string;
};

export type CancelBookingRequest = {
  reason?: string;
};

export type BookingFilters = {
  status?: BookingStatus | "";
  resourceId?: number | "";
  requesterUserId?: number | "";
  bookingDate?: string; // ISO date string
};

export type ApiErrorResponse = {
  message?: string;
  code?: string;
  validationErrors?: Record<string, string>;
};
