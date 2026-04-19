"use client";

import React, { useMemo } from "react";

export default function ResourceDemands({ bookings, resources }: { bookings: any[]; resources: any[] }) {
  const daysWindow = 30;

  const metrics = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    const resourceCountMap = new Map<string, number>();
    const dateMap = new Map<string, number>();
    const weekdayMap = new Map<number, number>();
    const hourMap = new Map<number, number>();

    const today = new Date();
    for (let i = daysWindow - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dateMap.set(d.toISOString().slice(0, 10), 0);
    }

    let attendeeTotal = 0;
    let attendeeCount = 0;
    let utilizationRatioTotal = 0;
    let utilizationRatioCount = 0;

    bookings.forEach((b: any) => {
      const bookingDate = (b.bookingDate || b.date || "").slice(0, 10);
      if (dateMap.has(bookingDate)) {
        dateMap.set(bookingDate, (dateMap.get(bookingDate) || 0) + 1);
      }

      const weekday = bookingDate ? new Date(`${bookingDate}T00:00:00`).getDay() : null;
      if (weekday != null) weekdayMap.set(weekday, (weekdayMap.get(weekday) || 0) + 1);

      const hour = (b.startTime || "").split(":")[0];
      const hourNum = Number.isNaN(Number(hour)) ? null : Number(hour);
      if (hourNum != null) hourMap.set(hourNum, (hourMap.get(hourNum) || 0) + 1);

      const rid = String(b.resourceId || b.resource?.id || b.resource?._id || "unknown");
      resourceCountMap.set(rid, (resourceCountMap.get(rid) || 0) + 1);

      if (b.expectedAttendees != null) {
        attendeeTotal += b.expectedAttendees;
        attendeeCount += 1;
        const r = resources.find((res: any) => String(res.id || res.resourceId || res._id) === rid);
        if (r?.capacity) {
          utilizationRatioTotal += b.expectedAttendees / r.capacity;
          utilizationRatioCount += 1;
        }
      }
    });

    const resourceLeaderboard = Array.from(resourceCountMap.entries())
      .map(([resourceId, count]) => {
        const r = resources.find((res: any) => String(res.id || res.resourceId || res._id) === resourceId) || {};
        return { resourceId, resourceName: r.name || r.title || `Resource ${resourceId}`, count, capacity: r.capacity || null };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const bookingsOverTime = Array.from(dateMap.entries()).map(([date, count]) => ({ date, count }));

    const weekdayDemand = Array.from({ length: 7 }).map((_, i) => ({ day: i, count: weekdayMap.get(i) || 0 }));

    const peakHours = Array.from({ length: 24 }).map((_, i) => ({ hour: i, count: hourMap.get(i) || 0 }));

    const totalBookings = bookings.length;
    const approvalRate = 0; // not tracked here for resources
    const averageAttendees = attendeeCount === 0 ? 0 : attendeeTotal / attendeeCount;
    const averageUtilization = utilizationRatioCount === 0 ? 0 : Math.round((utilizationRatioTotal / utilizationRatioCount) * 100);

    return {
      totalBookings,
      averageAttendees,
      averageUtilization,
      resourceLeaderboard,
      bookingsOverTime,
      weekdayDemand,
      peakHours,
    };
  }, [bookings, resources]);

  const maxTimeline = Math.max(1, ...metrics.bookingsOverTime.map((b) => b.count));
  const maxWeekday = Math.max(1, ...metrics.weekdayDemand.map((d) => d.count));
  const maxPeak = Math.max(1, ...metrics.peakHours.map((p) => p.count));
  const maxResource = Math.max(1, ...metrics.resourceLeaderboard.map((r) => r.count));

  return (
    <section>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ padding: 12, background: '#fff', borderRadius: 10 }}>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Requests</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{metrics.totalBookings}</div>
        </div>
        <div style={{ padding: 12, background: '#fff', borderRadius: 10 }}>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Avg Attendees</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{metrics.averageAttendees.toFixed(1)}</div>
        </div>
        <div style={{ padding: 12, background: '#fff', borderRadius: 10 }}>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Seat Usage</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{metrics.averageUtilization}%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
        <div style={{ background: '#fff', padding: 14, borderRadius: 12 }}>
          <div style={{ color: '#6b7280', fontSize: 12 }}>30-day trend</div>
          <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 6, marginTop: 8 }}>
            {metrics.bookingsOverTime.map((b) => (
              <div key={b.date} style={{ flex: 1, background: '#e6eefc', height: `${(b.count / maxTimeline) * 100}%`, borderRadius: 6 }} title={`${b.date}: ${b.count}`} />
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', padding: 14, borderRadius: 12 }}>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Weekday demand</div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {metrics.weekdayDemand.map((d) => (
              <div key={d.day} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 42 }}>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.day]}</div>
                <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 6 }}>
                  <div style={{ width: `${(d.count / maxWeekday) * 100}%`, height: '100%', background: '#f59e0b' }} />
                </div>
                <div style={{ width: 36, textAlign: 'right', fontWeight: 700 }}>{d.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, background: '#fff', padding: 14, borderRadius: 12 }}>
        <div style={{ color: '#6b7280', fontSize: 12 }}>Top resources</div>
        {metrics.resourceLeaderboard.length === 0 ? (
          <div style={{ padding: 12, color: '#6b7280' }}>No demand data</div>
        ) : (
          <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            {metrics.resourceLeaderboard.map((r) => (
              <div key={r.resourceId} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 48px', alignItems: 'center', gap: 10 }}>
                <div style={{ fontWeight: 800 }}>{String(metrics.resourceLeaderboard.indexOf(r) + 1).padStart(2, '0')}</div>
                <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{r.resourceName}</div>
                <div style={{ height: 10, background: '#f1f5f9', borderRadius: 6 }}>
                  <div style={{ width: `${(r.count / maxResource) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#2563eb,#8b5cf6)' }} />
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700 }}>{r.count}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
