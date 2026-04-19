"use client";

import React, { useMemo, useState } from "react";
import type { BookingSummaryResponse, BookingStatus } from "@/lib/bookings/types";

const SLOT_START = 8;
const SLOT_END = 18;
const SLOT_DURATION = 1;
const SLOTS: number[] = [];
for (let hour = SLOT_START; hour < SLOT_END; hour += SLOT_DURATION) {
  SLOTS.push(hour);
}

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Resource {
  id: number;
  name: string;
  resourceCode?: string;
  code?: string;
}

interface BookingCalendarProps {
  bookings: BookingSummaryResponse[];
  resources: Resource[];
  onSlotClick?: (date: string, startTime: string, endTime: string, resourceId?: number) => void;
}

interface HoveredBooking {
  booking: BookingSummaryResponse;
  x: number;
  y: number;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function getWeekStart(date: Date) {
  const result = new Date(date);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

function fmt12(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${normalizedHour}:00 ${suffix}`;
}

function formatClockTime(time: string) {
  const [rawHours, rawMinutes] = time.split(":").map(Number);
  const suffix = rawHours >= 12 ? "PM" : "AM";
  const hours = rawHours % 12 || 12;
  return `${hours}:${String(rawMinutes).padStart(2, "0")} ${suffix}`;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function bookingOverlapsSlot(
  booking: BookingSummaryResponse,
  slotStartHour: number,
  slotEndHour: number
) {
  const bookingStart = timeToMinutes(booking.startTime);
  const bookingEnd = timeToMinutes(booking.endTime);
  const slotStart = slotStartHour * 60;
  const slotEnd = slotEndHour * 60;
  return bookingStart < slotEnd && bookingEnd > slotStart;
}

const BOOKING_COLORS = [
  { bg: "bg-cyan-50", border: "border-cyan-300", text: "text-cyan-900", dot: "bg-cyan-500" },
  { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-900", dot: "bg-blue-500" },
  { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-900", dot: "bg-purple-500" },
  { bg: "bg-pink-50", border: "border-pink-300", text: "text-pink-900", dot: "bg-pink-500" },
  { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-900", dot: "bg-orange-500" },
  { bg: "bg-green-50", border: "border-green-300", text: "text-green-900", dot: "bg-green-500" },
];

function getBookingColor(bookingId: number) {
  return BOOKING_COLORS[bookingId % BOOKING_COLORS.length];
}

function getStatusStyles(status: BookingStatus): { dot: string; label: string } {
  switch (status) {
    case "APPROVED":
      return { dot: "bg-green-500", label: "Approved" };
    case "PENDING":
      return { dot: "bg-amber-500", label: "Pending" };
    case "REJECTED":
      return { dot: "bg-red-500", label: "Rejected" };
    case "CANCELLED":
      return { dot: "bg-gray-500", label: "Cancelled" };
    default:
      return { dot: "bg-gray-400", label: "Unknown" };
  }
}

export function BookingCalendar({
  bookings,
  resources,
  onSlotClick,
}: BookingCalendarProps) {
  const today = useMemo(() => {
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    return current;
  }, []);

  const [view, setView] = useState<"weekly" | "daily">("weekly");
  const [anchor, setAnchor] = useState<Date>(new Date(today));
  const [hoveredBooking, setHoveredBooking] = useState<HoveredBooking | null>(null);

  const bookingsByResourceAndDate = useMemo(() => {
    const map = new Map<string, BookingSummaryResponse[]>();

    bookings.forEach((booking) => {
      const key = `${booking.resourceId}_${booking.bookingDate}`;
      const existing = map.get(key) ?? [];
      existing.push(booking);
      map.set(key, existing);
    });

    map.forEach((items) =>
      items.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
    );

    return map;
  }, [bookings]);

  function getBookingsForSlot(resourceId: number, date: string, startHour: number) {
    const slotEndHour = startHour + SLOT_DURATION;
    const dayBookings = bookingsByResourceAndDate.get(`${resourceId}_${date}`) ?? [];
    return dayBookings.filter((booking) =>
      bookingOverlapsSlot(booking, startHour, slotEndHour)
    );
  }

  function isPastDate(date: string): boolean {
    const [year, month, day] = date.split("-").map(Number);
    const selectedDate = new Date(year, month - 1, day);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate < today;
  }

  function handleSlotClick(date: string, startHour: number, resourceId?: number) {
    if (isPastDate(date) || !onSlotClick) return;
    const startTime = `${String(startHour).padStart(2, "0")}:00`;
    const endTime = `${String(startHour + SLOT_DURATION).padStart(2, "0")}:00`;
    onSlotClick(date, startTime, endTime, resourceId);
  }

  const weekStart = getWeekStart(anchor);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  const todayKey = dateKey(today);
  const anchorKey = dateKey(anchor);
  const totalBookings = bookings.length;
  const pendingCount = bookings.filter((booking) => booking.status === "PENDING").length;
  const approvedCount = bookings.filter((booking) => booking.status === "APPROVED").length;

  if (!resources || resources.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-100">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 relative">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</span>
          <span className="text-sm font-bold text-slate-800">{totalBookings}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Pending</span>
          <span className="text-sm font-bold text-amber-700">{pendingCount}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Approved</span>
          <span className="text-sm font-bold text-emerald-700">{approvedCount}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAnchor((current) => addDays(current, view === "weekly" ? -7 : -1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 transition-all text-sm font-medium"
            >
              ‹
            </button>
            <button
              onClick={() => setAnchor((current) => addDays(current, view === "weekly" ? 7 : 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 transition-all text-sm font-medium"
            >
              ›
            </button>

            <h2 className="text-base font-semibold text-slate-800 ml-2 min-w-[200px]">
              {view === "weekly"
                ? `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} - ${addDays(weekStart, 6).getDate()}, ${weekStart.getFullYear()}`
                : `${DAYS_FULL[anchor.getDay()]}, ${MONTHS[anchor.getMonth()]} ${anchor.getDate()}`}
            </h2>

            <button
              onClick={() => setAnchor(new Date(today))}
              className="ml-1 px-3 h-8 text-xs font-semibold rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all"
            >
              Today
            </button>
          </div>

          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setView("weekly")}
              className={`px-4 h-7 text-xs font-semibold rounded-md transition-all ${
                view === "weekly" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView("daily")}
              className={`px-4 h-7 text-xs font-semibold rounded-md transition-all ${
                view === "daily" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Day
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div
            className="grid"
            style={{
              gridTemplateColumns:
                view === "weekly"
                  ? "72px repeat(7, minmax(100px, 1fr))"
                  : `72px repeat(${resources.length}, minmax(120px, 1fr))`,
            }}
          >
            <div className="sticky left-0 z-10 bg-slate-50 border-b border-r border-slate-100 h-12" />

            {view === "weekly"
              ? weekDays.map((day, index) => {
                  const isToday = dateKey(day) === todayKey;
                  return (
                    <div
                      key={index}
                      className={`flex flex-col items-center justify-center h-12 border-b border-r border-slate-100 last:border-r-0 ${
                        isToday ? "bg-blue-50" : "bg-slate-50"
                      }`}
                    >
                      <span className={`text-xs font-medium uppercase tracking-widest ${isToday ? "text-blue-500" : "text-slate-400"}`}>
                        {DAYS_SHORT[day.getDay()]}
                      </span>
                      <span
                        className={`text-sm font-bold mt-0.5 ${
                          isToday
                            ? "w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white"
                            : "text-slate-700"
                        }`}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                  );
                })
              : resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex flex-col items-center justify-center h-12 border-b border-r border-slate-100 last:border-r-0 bg-slate-50 px-2"
                  >
                    <span className="text-xs font-semibold text-slate-600 truncate max-w-full">{resource.name}</span>
                    {(resource.resourceCode ?? resource.code) && (
                      <span className="text-xs text-slate-400 mt-0.5">{resource.resourceCode ?? resource.code}</span>
                    )}
                  </div>
                ))}

            {SLOTS.map((startHour) => (
              <React.Fragment key={`slot-${startHour}`}>
                <div
                  className="sticky left-0 z-10 bg-white border-b border-r border-slate-100 flex items-start justify-end pr-3 pt-2"
                  style={{ minHeight: "72px" }}
                >
                  <span className="text-xs font-medium text-slate-400">{fmt12(startHour)}</span>
                </div>

                {view === "weekly"
                  ? weekDays.map((day, index) => {
                      const dayKey = dateKey(day);
                      const isToday = dayKey === todayKey;
                      const isPast = isPastDate(dayKey);
                      const slotBookings = resources.flatMap((resource) =>
                        getBookingsForSlot(resource.id, dayKey, startHour)
                      );

                      return (
                        <div
                          key={`week-${index}-${startHour}`}
                          style={{ minHeight: "72px" }}
                          className={`border-b border-r border-slate-100 last:border-r-0 p-1 group transition-colors ${
                            isPast
                              ? "bg-slate-50/40 opacity-50 cursor-not-allowed"
                              : `cursor-pointer ${isToday ? "hover:bg-blue-50/50" : "hover:bg-slate-50"}`
                          }`}
                          onClick={() => handleSlotClick(dayKey, startHour)}
                        >
                          {slotBookings.length === 0 && (
                            <div className="hidden group-hover:flex items-center justify-center h-full opacity-60">
                              <span className="text-xs text-blue-600 font-medium">+ Book</span>
                            </div>
                          )}
                          {slotBookings.map((booking) => {
                            const color = getBookingColor(booking.id);
                            const statusStyle = getStatusStyles(booking.status);
                            return (
                              <div
                                key={booking.id}
                                className={`rounded-lg px-2 py-1.5 ${color.bg} border ${color.border} w-full mb-1 cursor-pointer hover:shadow-md transition-all`}
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setHoveredBooking({
                                    booking,
                                    x: rect.left,
                                    y: rect.bottom + 8,
                                  });
                                }}
                                onMouseLeave={() => setHoveredBooking(null)}
                              >
                                <p className={`text-xs font-semibold truncate leading-tight ${color.text}`}>
                                  {booking.resourceName}
                                </p>
                                <p className={`text-xs opacity-70 leading-tight mt-0.5 ${color.text}`}>
                                  {formatClockTime(booking.startTime)}-{formatClockTime(booking.endTime)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  : resources.map((resource) => {
                      const isPast = isPastDate(anchorKey);
                      const booking = getBookingsForSlot(resource.id, anchorKey, startHour)[0];
                      const color = booking ? getBookingColor(booking.id) : null;

                      return (
                        <div
                          key={`day-${resource.id}-${startHour}`}
                          style={{ minHeight: "72px" }}
                          className={`border-b border-r border-slate-100 last:border-r-0 p-1.5 group transition-colors ${
                            isPast
                              ? "bg-slate-50/40 opacity-50 cursor-not-allowed"
                              : "cursor-pointer hover:bg-slate-50"
                          }`}
                          onClick={() => handleSlotClick(anchorKey, startHour, resource.id)}
                        >
                          {!booking && (
                            <div className="hidden group-hover:flex items-center justify-center h-full opacity-60">
                              <span className="text-xs text-blue-600 font-medium">+ Book</span>
                            </div>
                          )}
                          {booking && color && (
                            <div
                              className={`rounded-lg px-2 py-2 ${color.bg} border ${color.border} w-full h-full cursor-pointer hover:shadow-md transition-all`}
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredBooking({
                                  booking,
                                  x: rect.left,
                                  y: rect.bottom + 8,
                                });
                              }}
                              onMouseLeave={() => setHoveredBooking(null)}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusStyles(booking.status).dot}`} />
                                <p className={`text-xs font-semibold truncate leading-tight capitalize ${color.text}`}>
                                  {booking.status.toLowerCase()}
                                </p>
                              </div>
                              <p className={`text-xs font-medium truncate leading-tight ${color.text}`}>{booking.requesterDisplayName}</p>
                              <p className={`text-xs opacity-60 leading-tight mt-0.5 ${color.text}`}>
                                {formatClockTime(booking.startTime)} - {formatClockTime(booking.endTime)}
                              </p>
                              {booking.expectedAttendees && (
                                <p className={`text-xs opacity-60 leading-tight mt-0.5 ${color.text}`}>
                                  {booking.expectedAttendees} attendees
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6 px-6 py-3 border-t border-slate-100 bg-slate-50 flex-wrap">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Legend</span>
          {[
            { label: "Approved", dot: "bg-emerald-500" },
            { label: "Pending", dot: "bg-amber-400" },
            { label: "Rejected", dot: "bg-red-500" },
            { label: "Cancelled", dot: "bg-slate-400" },
          ].map(({ label, dot }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="w-2 h-2 rounded-sm border border-dashed border-indigo-400" />
            <span className="text-xs text-slate-400">Click any empty slot to book</span>
          </div>
        </div>
      </div>

      {hoveredBooking && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-slate-200 p-4 w-80 pointer-events-none"
          style={{
            left: `${hoveredBooking.x}px`,
            top: `${hoveredBooking.y}px`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{hoveredBooking.booking.resourceName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{hoveredBooking.booking.resourceCode}</p>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Requester:</span>
                <span className="font-medium text-slate-900">{hoveredBooking.booking.requesterDisplayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-medium text-slate-900">{hoveredBooking.booking.bookingDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time:</span>
                <span className="font-medium text-slate-900">
                  {formatClockTime(hoveredBooking.booking.startTime)} - {formatClockTime(hoveredBooking.booking.endTime)}
                </span>
              </div>
              {hoveredBooking.booking.expectedAttendees && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Attendees:</span>
                  <span className="font-medium text-slate-900">{hoveredBooking.booking.expectedAttendees}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className={`font-medium ${getStatusStyles(hoveredBooking.booking.status).dot}`}>
                  {getStatusStyles(hoveredBooking.booking.status).label}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
