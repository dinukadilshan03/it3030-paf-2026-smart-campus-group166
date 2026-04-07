import { apiFetch, apiRequest } from './api';

interface BookingEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
}

export interface BookingRecord {
  id: number;
  resource: {
    id: number;
    name: string;
    type?: string;
    location?: string;
    capacity?: number;
    status?: string;
  } | null;
  user: {
    userId: number;
    name: string;
    email: string;
  } | null;
  startTime: string;
  endTime: string;
  purpose: string | null;
  expectedAttendees: number | null;
  status: string;
  approvalReason: string | null;
  qrCodeBase64: string | null;
  createdAt: string;
  updatedAt: string;
  checkedIn: boolean;
  checkInTime: string | null;
}

export interface BookingCreatePayload {
  resourceId: number;
  userId: number;
  startTime: string;
  endTime: string;
  purpose?: string;
  expectedAttendees?: number;
}

export interface BookingUpdatePayload {
  startTime: string;
  endTime: string;
  purpose?: string;
  expectedAttendees?: number;
  status?: string;
}

export async function getBookings() {
  const response = await apiFetch<BookingEnvelope<BookingRecord[]>>('/api/bookings');
  return response.data;
}

export async function getBookingById(bookingId: number) {
  const response = await apiFetch<BookingEnvelope<BookingRecord>>(`/api/bookings/${bookingId}`);
  return response.data;
}

export async function createBooking(payload: BookingCreatePayload) {
  const response = await apiFetch<BookingEnvelope<BookingRecord>>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function updateBooking(bookingId: number, payload: BookingUpdatePayload) {
  const response = await apiFetch<BookingEnvelope<BookingRecord>>(`/api/bookings/${bookingId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function deleteBooking(bookingId: number) {
  await apiRequest(`/api/bookings/${bookingId}`, {
    method: 'DELETE',
  });
}

export async function approveBooking(bookingId: number, reason?: string) {
  const url = reason 
    ? `/api/bookings/${bookingId}/approve?reason=${encodeURIComponent(reason)}`
    : `/api/bookings/${bookingId}/approve`;
  
  const response = await apiFetch<BookingEnvelope<BookingRecord>>(url, {
    method: 'POST',
  });

  return response.data;
}

export async function rejectBooking(bookingId: number, reason?: string) {
  const url = reason 
    ? `/api/bookings/${bookingId}/reject?reason=${encodeURIComponent(reason)}`
    : `/api/bookings/${bookingId}/reject`;
  
  const response = await apiFetch<BookingEnvelope<BookingRecord>>(url, {
    method: 'POST',
  });

  return response.data;
}
