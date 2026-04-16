"use client";

import { useState, useMemo } from "react";
import type { BookingSummaryResponse, BookingStatus } from "@/lib/bookings/types";

const SLOT_START = 8;
const SLOT_END = 18;
const SLOT_DURATION = 2;
const SLOTS: number[] = [];
for (let h = SLOT_START; h < SLOT_END; h += SLOT_DURATION) SLOTS.push(h);

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

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getWeekStart(d: Date) {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

function fmt12(h: number) {
  const suffix = h >= 12 ? "PM" : "AM";
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hh}:00 ${suffix}`;
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
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [view, setView] = useState<"weekly" | "daily">("weekly");
  const [anchor, setAnchor] = useState<Date>(new Date(today));

  const bookingMap = useMemo(() => {
    const map = new Map<string, BookingSummaryResponse>();
    bookings.forEach((b) => {
      if (!b.startTime) return;
      const startHour = b.startTime.slice(0, 2);
      map.set(`${b.resourceId}_${b.bookingDate}_${startHour}`, b);
    });
    return map;
  }, [bookings]);

  function getBooking(resourceId: number, date: string, startHour: number) {
    return bookingMap.get(`${resourceId}_${date}_${String(startHour).padStart(2, "0")}`);
  }

  function handleSlotClick(date: string, startHour: number, resourceId?: number) {
    if (!onSlotClick) return;
    const startTime = `${String(startHour).padStart(2, "0")}:00`;
    const endTime = `${String(startHour + SLOT_DURATION).padStart(2, "0")}:00`;
    onSlotClick(date, startTime, endTime, resourceId);
  }

  const weekStart = getWeekStart(anchor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const todayKey = dateKey(today);
  const anchorKey = dateKey(anchor);

  // Stats
  const totalBookings = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const approvedCount = bookings.filter((b) => b.status === "APPROVED").length;

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

      {/* ── Top stat pills ── */}
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

      {/* ── Calendar card ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 flex-wrap">

          {/* Nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAnchor((a) => addDays(a, view === "weekly" ? -7 : -1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 transition-all text-sm font-medium"
            >
              ‹
            </button>
            <button
              onClick={() => setAnchor((a) => addDays(a, view === "weekly" ? 7 : 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 transition-all text-sm font-medium"
            >
              ›
            </button>

            <h2 className="text-base font-semibold text-slate-800 ml-2 min-w-[200px]">
              {view === "weekly"
                ? `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${addDays(weekStart, 6).getDate()}, ${weekStart.getFullYear()}`
                : `${DAYS_FULL[anchor.getDay()]}, ${MONTHS[anchor.getMonth()]} ${anchor.getDate()}`}
            </h2>

            <button
              onClick={() => setAnchor(new Date(today))}
              className="ml-1 px-3 h-8 text-xs font-semibold rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all"
            >
              Today
            </button>
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setView("weekly")}
              className={`px-4 h-7 text-xs font-semibold rounded-md transition-all ${
                view === "weekly"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView("daily")}
              className={`px-4 h-7 text-xs font-semibold rounded-md transition-all ${
                view === "daily"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Day
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto">
          <div
            className="grid"
            style={{
              gridTemplateColumns:
                view === "weekly"
                  ? `72px repeat(7, minmax(100px, 1fr))`
                  : `72px repeat(${resources.length}, minmax(120px, 1fr))`,
            }}
          >
            {/* ── Header row ── */}
            <div className="sticky left-0 z-10 bg-slate-50 border-b border-r border-slate-100 h-12" />

            {view === "weekly"
              ? weekDays.map((day, i) => {
                  const isToday = dateKey(day) === todayKey;
                  return (
                    <div
                      key={i}
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
              : resources.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col items-center justify-center h-12 border-b border-r border-slate-100 last:border-r-0 bg-slate-50 px-2"
                  >
                    <span className="text-xs font-semibold text-slate-600 truncate max-w-full">{r.name}</span>
                    {(r.resourceCode ?? r.code) && (
                      <span className="text-xs text-slate-400 mt-0.5">{r.resourceCode ?? r.code}</span>
                    )}
                  </div>
                ))}

            {/* ── Slot rows ── */}
            {SLOTS.map((startHour) => (
              <>
                {/* Time label */}
                <div
                  key={`t-${startHour}`}
                  className="sticky left-0 z-10 bg-white border-b border-r border-slate-100 flex items-start justify-end pr-3 pt-2"
                  style={{ minHeight: "72px" }}
                >
                  <span className="text-xs font-medium text-slate-400">{fmt12(startHour)}</span>
                </div>

                {/* Slot cells */}
                {view === "weekly"
                  ? weekDays.map((day, i) => {
                      const dKey = dateKey(day);
                      const isToday = dKey === todayKey;
                      const slotBookings = resources
                        .map((r) => getBooking(r.id, dKey, startHour))
                        .filter((b): b is BookingSummaryResponse => Boolean(b));

                      return (
                        <div
                          key={`week-${i}-${startHour}`}
                          style={{ minHeight: "72px" }}
                          className={`border-b border-r border-slate-100 last:border-r-0 p-1 group transition-colors ${
                            slotBookings.length === 0
                              ? `cursor-pointer ${isToday ? "hover:bg-indigo-50/50" : "hover:bg-slate-50"}`
                              : "cursor-default"
                          }`}
                          onClick={() => slotBookings.length === 0 && handleSlotClick(dKey, startHour)}
                        >
                          {slotBookings.length === 0 && (
                            <div className="hidden group-hover:flex items-center justify-center h-full opacity-60">
                              <span className="text-xs text-indigo-500 font-medium">+ Book</span>
                            </div>
                          )}
                          {slotBookings.map((b) => {
                            const s = getStatusStyles(b.status);
                            return (
                              <div key={b.id} className={`rounded-md px-2 py-1.5 ${s.chip} w-full mb-1`}>
                                <p className="text-xs font-semibold truncate leading-tight">{b.resourceName}</p>
                                <p className="text-xs opacity-70 leading-tight mt-0.5">
                                  {fmt12(startHour)}–{fmt12(startHour + SLOT_DURATION)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  : resources.map((r) => {
                      const dKey = anchorKey;
                      const booking = getBooking(r.id, dKey, startHour);
                      const s = booking ? getStatusStyles(booking.status) : null;

                      return (
                        <div
                          key={`day-${r.id}-${startHour}`}
                          style={{ minHeight: "72px" }}
                          className={`border-b border-r border-slate-100 last:border-r-0 p-1.5 group transition-colors ${
                            !booking ? "cursor-pointer hover:bg-slate-50" : "cursor-default"
                          }`}
                          onClick={() => !booking && handleSlotClick(dKey, startHour, r.id)}
                        >
                          {!booking && (
                            <div className="hidden group-hover:flex items-center justify-center h-full opacity-60">
                              <span className="text-xs text-indigo-500 font-medium">+ Book</span>
                            </div>
                          )}
                          {booking && s && (
                            <div className={`rounded-md px-2 py-2 ${s.chip} w-full h-full`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                                <p className="text-xs font-semibold truncate leading-tight capitalize">
                                  {booking.status.toLowerCase()}
                                </p>
                              </div>
                              <p className="text-xs font-medium truncate leading-tight">{booking.requesterDisplayName}</p>
                              <p className="text-xs opacity-60 leading-tight mt-0.5">
                                {fmt12(startHour)} – {fmt12(startHour + SLOT_DURATION)}
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
              </>
            ))}
          </div>
        </div>

        {/* Legend */}
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