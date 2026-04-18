"use client";

import { useMemo } from "react";
import type { BookingSummaryResponse } from "@/lib/bookings/types";
import type { Resource } from "@/lib/resources/types";

interface BookingAnalyticsProps {
  bookings: BookingSummaryResponse[];
  resources: Resource[];
}

type StatusSlice = {
  label: string;
  value: number;
  color: string;
  textColor: string;
};

const STATUS_STYLES: Record<BookingSummaryResponse["status"], { color: string; textColor: string }> = {
  APPROVED: { color: "#0f766e", textColor: "#115e59" },
  PENDING: { color: "#d97706", textColor: "#92400e" },
  REJECTED: { color: "#dc2626", textColor: "#991b1b" },
  CANCELLED: { color: "#64748b", textColor: "#475569" },
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatShortDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toHourNumber(time: string) {
  const [hour] = time.split(":").map(Number);
  return Number.isNaN(hour) ? null : hour;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function BookingAnalytics({ bookings, resources }: BookingAnalyticsProps) {
  const metrics = useMemo(() => {
    const statusCounts = {
      APPROVED: 0,
      PENDING: 0,
      REJECTED: 0,
      CANCELLED: 0,
    };

    const resourceCountMap = new Map<number, number>();
    const dateMap = new Map<string, number>();
    const weekdayMap = new Map<number, number>();
    const hourMap = new Map<number, number>();

    let attendeeTotal = 0;
    let attendeeBookingCount = 0;
    let utilizationRatioTotal = 0;
    let utilizationRatioCount = 0;

    const today = new Date();
    for (let index = 29; index >= 0; index -= 1) {
      const day = new Date(today);
      day.setDate(day.getDate() - index);
      dateMap.set(day.toISOString().split("T")[0], 0);
    }

    bookings.forEach((booking) => {
      statusCounts[booking.status] += 1;
      resourceCountMap.set(booking.resourceId, (resourceCountMap.get(booking.resourceId) ?? 0) + 1);

      const bookingDate = typeof booking.bookingDate === "string"
        ? booking.bookingDate
        : new Date(booking.bookingDate).toISOString().split("T")[0];
      if (dateMap.has(bookingDate)) {
        dateMap.set(bookingDate, (dateMap.get(bookingDate) ?? 0) + 1);
      }

      const weekday = new Date(`${bookingDate}T00:00:00`).getDay();
      weekdayMap.set(weekday, (weekdayMap.get(weekday) ?? 0) + 1);

      const hour = toHourNumber(booking.startTime);
      if (hour != null) {
        hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
      }

      if (booking.expectedAttendees != null) {
        attendeeTotal += booking.expectedAttendees;
        attendeeBookingCount += 1;

        const resource = resources.find((item) => item.id === booking.resourceId);
        if (resource?.capacity) {
          utilizationRatioTotal += booking.expectedAttendees / resource.capacity;
          utilizationRatioCount += 1;
        }
      }
    });

    const statusSlices: StatusSlice[] = [
      { label: "Approved", value: statusCounts.APPROVED, ...STATUS_STYLES.APPROVED },
      { label: "Pending", value: statusCounts.PENDING, ...STATUS_STYLES.PENDING },
      { label: "Rejected", value: statusCounts.REJECTED, ...STATUS_STYLES.REJECTED },
      { label: "Cancelled", value: statusCounts.CANCELLED, ...STATUS_STYLES.CANCELLED },
    ];

    const resourceLeaderboard = Array.from(resourceCountMap.entries())
      .map(([resourceId, count]) => {
        const resource = resources.find((item) => item.id === resourceId);
        return {
          resourceId,
          resourceName: resource?.name ?? `Resource ${resourceId}`,
          count,
          capacity: resource?.capacity ?? null,
        };
      })
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);

    const bookingsOverTime = Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      label: formatShortDate(date),
      count,
    }));

    const weekdayDemand = WEEKDAY_LABELS.map((label, index) => ({
      label,
      count: weekdayMap.get(index) ?? 0,
    }));

    const peakHours = Array.from({ length: 12 }, (_, index) => {
      const hour = 8 + index;
      return {
        hour,
        label: `${String(hour).padStart(2, "0")}:00`,
        count: hourMap.get(hour) ?? 0,
      };
    });

    const totalBookings = bookings.length;
    const approvalRate = totalBookings === 0 ? 0 : Math.round((statusCounts.APPROVED / totalBookings) * 100);
    const averageAttendees = attendeeBookingCount === 0 ? 0 : (attendeeTotal / attendeeBookingCount);
    const averageUtilization = utilizationRatioCount === 0 ? 0 : Math.round((utilizationRatioTotal / utilizationRatioCount) * 100);
    const busiestDay = [...weekdayDemand].sort((left, right) => right.count - left.count)[0];
    const busiestHour = [...peakHours].sort((left, right) => right.count - left.count)[0];

    return {
      totalBookings,
      approvalRate,
      averageAttendees,
      averageUtilization,
      statusSlices,
      resourceLeaderboard,
      bookingsOverTime,
      weekdayDemand,
      peakHours,
      busiestDay,
      busiestHour,
    };
  }, [bookings, resources]);

  const maxTimelineCount = Math.max(...metrics.bookingsOverTime.map((item) => item.count), 1);
  const maxWeekdayCount = Math.max(...metrics.weekdayDemand.map((item) => item.count), 1);
  const maxPeakHourCount = Math.max(...metrics.peakHours.map((item) => item.count), 1);
  const maxResourceCount = Math.max(...metrics.resourceLeaderboard.map((item) => item.count), 1);

  const donutBackground = useMemo(() => {
    const total = metrics.statusSlices.reduce((sum, slice) => sum + slice.value, 0);
    if (total === 0) {
      return "conic-gradient(#cbd5e1 0deg 360deg)";
    }

    let currentAngle = 0;
    const segments = metrics.statusSlices.map((slice) => {
      const sliceAngle = (slice.value / total) * 360;
      const start = currentAngle;
      currentAngle += sliceAngle;
      return `${slice.color} ${start}deg ${currentAngle}deg`;
    });

    return `conic-gradient(${segments.join(", ")})`;
  }, [metrics.statusSlices]);

  return (
    <section className="analytics-shell">
      <div className="hero-card">
        <div>
          <p className="eyebrow">Booking Intelligence</p>
          <h2>Operational view of demand, approvals, and resource pressure.</h2>
          <p className="hero-copy">
            Track how requests move through the system, when demand spikes, and which spaces carry the heaviest load.
          </p>
        </div>

        <div className="hero-metrics">
          <div className="metric-card">
            <span className="metric-label">Total bookings</span>
            <strong className="metric-value">{metrics.totalBookings}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Approval rate</span>
            <strong className="metric-value">{metrics.approvalRate}%</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Avg attendees</span>
            <strong className="metric-value">{metrics.averageAttendees.toFixed(1)}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Seat usage</span>
            <strong className="metric-value">{metrics.averageUtilization}%</strong>
          </div>
        </div>
      </div>

      <div className="headline-grid">
        <div className="headline-panel primary">
          <span className="panel-label">Busiest day</span>
          <strong>{metrics.busiestDay?.label ?? "N/A"}</strong>
          <p>{metrics.busiestDay?.count ?? 0} bookings scheduled</p>
        </div>
        <div className="headline-panel warm">
          <span className="panel-label">Peak start hour</span>
          <strong>{metrics.busiestHour?.label ?? "N/A"}</strong>
          <p>{metrics.busiestHour?.count ?? 0} bookings begin here</p>
        </div>
        <div className="headline-panel neutral">
          <span className="panel-label">Top resource</span>
          <strong>{metrics.resourceLeaderboard[0]?.resourceName ?? "N/A"}</strong>
          <p>{metrics.resourceLeaderboard[0]?.count ?? 0} requests recorded</p>
        </div>
      </div>

      <div className="analytics-grid">
        <article className="panel status-panel">
          <div className="panel-header">
            <div>
              <p className="panel-label">Status mix</p>
              <h3>Booking pipeline split</h3>
            </div>
          </div>

          <div className="status-layout">
            <div className="donut-wrap">
              <div className="donut-chart" style={{ background: donutBackground }}>
                <div className="donut-core">
                  <span>Total</span>
                  <strong>{metrics.totalBookings}</strong>
                </div>
              </div>
            </div>

            <div className="status-legend">
              {metrics.statusSlices.map((slice) => {
                const percentage = metrics.totalBookings === 0
                  ? 0
                  : Math.round((slice.value / metrics.totalBookings) * 100);
                return (
                  <div key={slice.label} className="legend-row">
                    <span className="legend-dot" style={{ backgroundColor: slice.color }} />
                    <div className="legend-copy">
                      <strong>{slice.label}</strong>
                      <span>{slice.value} bookings</span>
                    </div>
                    <span className="legend-percent" style={{ color: slice.textColor }}>
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        <article className="panel timeline-panel">
          <div className="panel-header">
            <div>
              <p className="panel-label">30-day trend</p>
              <h3>Recent booking activity</h3>
            </div>
          </div>

          <div className="timeline-chart">
            {metrics.bookingsOverTime.map((item, index) => (
              <div key={item.date} className="timeline-column" title={`${item.label}: ${item.count} bookings`}>
                <div
                  className="timeline-bar"
                  style={{ height: `${clampPercent((item.count / maxTimelineCount) * 100)}%` }}
                />
                {index % 5 === 0 && <span className="timeline-label">{item.label}</span>}
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-label">Day pattern</p>
              <h3>Weekday demand</h3>
            </div>
          </div>

          <div className="weekday-chart">
            {metrics.weekdayDemand.map((item) => (
              <div key={item.label} className="weekday-row">
                <span className="weekday-label">{item.label}</span>
                <div className="weekday-track">
                  <div
                    className="weekday-fill"
                    style={{ width: `${clampPercent((item.count / maxWeekdayCount) * 100)}%` }}
                  />
                </div>
                <span className="weekday-value">{item.count}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-label">Hour pattern</p>
              <h3>Peak booking start times</h3>
            </div>
          </div>

          <div className="heat-grid">
            {metrics.peakHours.map((item) => (
              <div key={item.hour} className="heat-cell-wrap">
                <div
                  className="heat-cell"
                  style={{ opacity: 0.22 + (item.count / maxPeakHourCount) * 0.78 }}
                  title={`${item.label}: ${item.count} bookings`}
                >
                  <span>{item.count}</span>
                </div>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel leaderboard-panel">
          <div className="panel-header">
            <div>
              <p className="panel-label">Resource ranking</p>
              <h3>Most requested spaces</h3>
            </div>
          </div>

          {metrics.resourceLeaderboard.length > 0 ? (
            <div className="leaderboard">
              {metrics.resourceLeaderboard.map((item, index) => (
                <div key={item.resourceId} className="leaderboard-row">
                  <div className="leader-rank">{String(index + 1).padStart(2, "0")}</div>
                  <div className="leader-copy">
                    <strong>{item.resourceName}</strong>
                    <span>
                      {item.capacity != null ? `Capacity ${item.capacity}` : "Capacity not set"}
                    </span>
                  </div>
                  <div className="leader-meter">
                    <div
                      className="leader-fill"
                      style={{ width: `${clampPercent((item.count / maxResourceCount) * 100)}%` }}
                    />
                  </div>
                  <div className="leader-value">{item.count}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No booking data available yet.</p>
          )}
        </article>
      </div>

      <style jsx>{`
        .analytics-shell {
          --ink-900: #14213d;
          --ink-700: #355070;
          --ink-500: #60738a;
          --line: rgba(20, 33, 61, 0.1);
          --paper: #fcfcf9;
          --panel: rgba(255, 255, 255, 0.88);
          --teal: #0f766e;
          --teal-soft: rgba(15, 118, 110, 0.14);
          --amber: #d97706;
          --amber-soft: rgba(217, 119, 6, 0.14);
          --red: #dc2626;
          --red-soft: rgba(220, 38, 38, 0.12);
          --slate: #64748b;
          --blue: #2563eb;
          --blue-soft: rgba(37, 99, 235, 0.12);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .hero-card {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 1.5rem;
          padding: 2rem;
          border-radius: 1.5rem;
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.16), transparent 30%),
            radial-gradient(circle at bottom left, rgba(15, 118, 110, 0.14), transparent 28%),
            linear-gradient(135deg, #fffdf7 0%, #f5f9ff 100%);
          border: 1px solid var(--line);
          box-shadow: 0 18px 40px rgba(20, 33, 61, 0.08);
        }

        .eyebrow,
        .panel-label {
          margin: 0 0 0.4rem;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--ink-500);
        }

        .hero-card h2 {
          margin: 0;
          font-size: clamp(1.75rem, 2.4vw, 2.6rem);
          line-height: 1.08;
          color: var(--ink-900);
          max-width: 16ch;
        }

        .hero-copy {
          margin: 0.9rem 0 0;
          max-width: 58ch;
          color: var(--ink-700);
          line-height: 1.6;
          font-size: 0.97rem;
        }

        .hero-metrics {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.9rem;
        }

        .metric-card,
        .headline-panel,
        .panel {
          background: var(--panel);
          border: 1px solid var(--line);
          box-shadow: 0 10px 24px rgba(20, 33, 61, 0.06);
        }

        .metric-card {
          border-radius: 1.1rem;
          padding: 1rem 1.1rem;
        }

        .metric-label {
          display: block;
          color: var(--ink-500);
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .metric-value {
          display: block;
          margin-top: 0.5rem;
          color: var(--ink-900);
          font-size: 1.85rem;
          line-height: 1;
        }

        .headline-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }

        .headline-panel {
          border-radius: 1.15rem;
          padding: 1.15rem 1.2rem;
        }

        .headline-panel strong {
          display: block;
          color: var(--ink-900);
          font-size: 1.3rem;
          margin-bottom: 0.25rem;
        }

        .headline-panel p {
          margin: 0;
          color: var(--ink-700);
          font-size: 0.92rem;
        }

        .headline-panel.primary {
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(37, 99, 235, 0.03));
        }

        .headline-panel.warm {
          background: linear-gradient(135deg, rgba(217, 119, 6, 0.12), rgba(217, 119, 6, 0.03));
        }

        .headline-panel.neutral {
          background: linear-gradient(135deg, rgba(15, 118, 110, 0.12), rgba(15, 118, 110, 0.03));
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: 1.1fr 1.4fr;
          gap: 1rem;
        }

        .panel {
          border-radius: 1.35rem;
          padding: 1.35rem;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.15rem;
        }

        .panel-header h3 {
          margin: 0;
          color: var(--ink-900);
          font-size: 1.12rem;
        }

        .status-panel {
          grid-row: span 2;
        }

        .timeline-panel,
        .leaderboard-panel {
          grid-column: span 1;
        }

        .status-layout {
          display: grid;
          gap: 1.4rem;
        }

        .donut-wrap {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0.5rem 0 0.25rem;
        }

        .donut-chart {
          width: 220px;
          height: 220px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          position: relative;
          box-shadow: inset 0 0 0 1px rgba(20, 33, 61, 0.06);
        }

        .donut-core {
          width: 116px;
          height: 116px;
          border-radius: 50%;
          background: #fffdfa;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--line);
          color: var(--ink-700);
        }

        .donut-core span {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
        }

        .donut-core strong {
          margin-top: 0.25rem;
          font-size: 1.9rem;
          color: var(--ink-900);
        }

        .status-legend {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .legend-row {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 0.8rem;
          padding: 0.8rem 0.9rem;
          border-radius: 1rem;
          background: rgba(255, 255, 255, 0.75);
          border: 1px solid var(--line);
        }

        .legend-dot {
          width: 0.8rem;
          height: 0.8rem;
          border-radius: 999px;
        }

        .legend-copy {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .legend-copy strong {
          color: var(--ink-900);
          font-size: 0.95rem;
        }

        .legend-copy span,
        .legend-percent {
          color: var(--ink-500);
          font-size: 0.83rem;
          font-weight: 700;
        }

        .timeline-chart {
          height: 250px;
          display: flex;
          align-items: flex-end;
          gap: 0.45rem;
          padding: 1rem 0.25rem 0;
          border-top: 1px solid var(--line);
        }

        .timeline-column {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          gap: 0.65rem;
          min-width: 0;
        }

        .timeline-bar {
          width: 100%;
          min-height: 4px;
          border-radius: 999px 999px 0 0;
          background: linear-gradient(180deg, #2563eb 0%, #0f766e 100%);
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.18);
        }

        .timeline-label {
          font-size: 0.68rem;
          color: var(--ink-500);
          transform: rotate(-40deg);
          white-space: nowrap;
          transform-origin: center;
        }

        .weekday-chart {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .weekday-row,
        .leaderboard-row {
          display: grid;
          align-items: center;
          gap: 0.8rem;
        }

        .weekday-row {
          grid-template-columns: 44px 1fr 28px;
        }

        .weekday-label,
        .weekday-value {
          color: var(--ink-700);
          font-size: 0.88rem;
          font-weight: 700;
        }

        .weekday-track,
        .leader-meter {
          height: 0.8rem;
          border-radius: 999px;
          background: rgba(20, 33, 61, 0.08);
          overflow: hidden;
        }

        .weekday-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
        }

        .heat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.8rem;
        }

        .heat-cell-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.45rem;
        }

        .heat-cell-wrap small {
          color: var(--ink-500);
          font-size: 0.72rem;
          font-weight: 700;
        }

        .heat-cell {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 1rem;
          background: linear-gradient(135deg, #0f766e 0%, #2563eb 100%);
          display: grid;
          place-items: center;
          color: white;
          font-size: 1rem;
          font-weight: 800;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
        }

        .leaderboard {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .leaderboard-row {
          grid-template-columns: 42px minmax(0, 1.1fr) minmax(120px, 1fr) 42px;
          padding: 0.9rem 0;
          border-top: 1px solid rgba(20, 33, 61, 0.08);
        }

        .leaderboard-row:first-child {
          border-top: none;
          padding-top: 0;
        }

        .leader-rank {
          width: 42px;
          height: 42px;
          border-radius: 1rem;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.13), rgba(15, 118, 110, 0.13));
          color: var(--ink-900);
          font-weight: 800;
        }

        .leader-copy {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .leader-copy strong {
          color: var(--ink-900);
          font-size: 0.95rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .leader-copy span,
        .leader-value {
          color: var(--ink-500);
          font-size: 0.8rem;
          font-weight: 700;
        }

        .leader-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #2563eb 0%, #8b5cf6 100%);
        }

        .leader-value {
          text-align: right;
        }

        .empty-state {
          margin: 0;
          color: var(--ink-500);
          font-size: 0.92rem;
          padding: 1rem 0 0;
        }

        @media (max-width: 1100px) {
          .hero-card,
          .headline-grid,
          .analytics-grid {
            grid-template-columns: 1fr;
          }

          .status-panel {
            grid-row: auto;
          }
        }

        @media (max-width: 720px) {
          .hero-card,
          .panel {
            padding: 1.25rem;
          }

          .hero-metrics {
            grid-template-columns: 1fr 1fr;
          }

          .donut-chart {
            width: 180px;
            height: 180px;
          }

          .donut-core {
            width: 96px;
            height: 96px;
          }

          .heat-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .leaderboard-row {
            grid-template-columns: 36px 1fr;
          }

          .leader-meter,
          .leader-value {
            grid-column: 2;
          }
        }
      `}</style>
    </section>
  );
}
