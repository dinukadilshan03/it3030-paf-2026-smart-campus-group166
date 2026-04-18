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

function getStatusStyles(status: BookingStatus): { chip: string; dot: string } {
  switch (status) {
    case "APPROVED":
      return {
        chip: "bg-emerald-50 border border-emerald-200 text-emerald-800",
        dot: "bg-emerald-500",
      };
    case "PENDING":
      return {
        chip: "bg-amber-50 border border-amber-200 border-dashed text-amber-800",
        dot: "bg-amber-400",
      };
    case "REJECTED":
      return {
        chip: "bg-red-50 border border-red-200 text-red-800",
        dot: "bg-red-500",
      };
    case "CANCELLED":
      return {
        chip: "bg-slate-50 border border-slate-200 text-slate-600",
        dot: "bg-slate-400",
      };
    default:
      return {
        chip: "bg-slate-50 border border-slate-200 text-slate-600",
        dot: "bg-slate-400",
      };
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
    <div className="flex flex-col gap-4">
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
                        isToday ? "bg-indigo-50" : "bg-slate-50"
                      }`}
                    >
                      <span className={`text-xs font-medium uppercase tracking-widest ${isToday ? "text-indigo-400" : "text-slate-400"}`}>
                        {DAYS_SHORT[day.getDay()]}
                      </span>
                      <span
                        className={`text-sm font-bold mt-0.5 ${
                          isToday
                            ? "w-6 h-6 flex items-center justify-center rounded-full bg-indigo-600 text-white"
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
                              : `cursor-pointer ${isToday ? "hover:bg-indigo-50/50" : "hover:bg-slate-50"}`
                          }`}
                          onClick={() => handleSlotClick(dayKey, startHour)}
                        >
                          {slotBookings.length === 0 && (
                            <div className="hidden group-hover:flex items-center justify-center h-full opacity-60">
                              <span className="text-xs text-indigo-500 font-medium">+ Book</span>
                            </div>
                          )}
                          {slotBookings.map((booking) => {
                            const styles = getStatusStyles(booking.status);
                            return (
                              <div key={booking.id} className={`rounded-md px-2 py-1.5 ${styles.chip} w-full mb-1`}>
                                <p className="text-xs font-semibold truncate leading-tight">{booking.resourceName}</p>
                                <p className="text-xs opacity-70 leading-tight mt-0.5">
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
                      const styles = booking ? getStatusStyles(booking.status) : null;

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
                              <span className="text-xs text-indigo-500 font-medium">+ Book</span>
                            </div>
                          )}
                          {booking && styles && (
                            <div className={`rounded-md px-2 py-2 ${styles.chip} w-full h-full`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.dot}`} />
                                <p className="text-xs font-semibold truncate leading-tight capitalize">
                                  {booking.status.toLowerCase()}
                                </p>
                              </div>
                              <p className="text-xs font-medium truncate leading-tight">{booking.requesterDisplayName}</p>
                              <p className="text-xs opacity-60 leading-tight mt-0.5">
                                {formatClockTime(booking.startTime)} - {formatClockTime(booking.endTime)}
                              </p>
                              {booking.expectedAttendees && (
                                <p className="text-xs opacity-60 leading-tight mt-0.5">
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
    </div>
  );
}
