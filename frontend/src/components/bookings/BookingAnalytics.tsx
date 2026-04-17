"use client";

import { useMemo } from "react";
import type { BookingSummaryResponse } from "@/lib/bookings/types";
import type { Resource } from "@/lib/resources/types";

interface BookingAnalyticsProps {
  bookings: BookingSummaryResponse[];
  resources: Resource[];
}

export function BookingAnalytics({ bookings, resources }: BookingAnalyticsProps) {
  // Calculate bookings per resource
  const bookingsPerResource = useMemo(() => {
    const resourceMap = new Map<number, number>();
    bookings.forEach((booking) => {
      resourceMap.set(
        booking.resourceId,
        (resourceMap.get(booking.resourceId) || 0) + 1
      );
    });

    return Array.from(resourceMap.entries())
      .map(([resourceId, count]) => {
        const resource = resources.find((r) => r.id === resourceId);
        return {
          resourceId,
          resourceName: resource?.name || `Resource ${resourceId}`,
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 resources
  }, [bookings, resources]);

  // Calculate bookings over time (last 30 days)
  const bookingsOverTime = useMemo(() => {
    const dateMap = new Map<string, number>();
    const today = new Date();

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dateMap.set(dateStr, 0);
    }

    // Count bookings - handle both string and Date objects
    bookings.forEach((booking) => {
      let dateStr: string;
      if (typeof booking.bookingDate === "string") {
        dateStr = booking.bookingDate;
      } else {
        dateStr = new Date(booking.bookingDate).toISOString().split("T")[0];
      }
      
      if (dateMap.has(dateStr)) {
        dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
      }
    });

    return Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }, [bookings]);

  // Calculate peak hours
  const peakHours = useMemo(() => {
    const hourMap = new Map<number, number>();

    bookings.forEach((booking) => {
      if (booking.startTime) {
        const timeStr = String(booking.startTime);
        const [hour] = timeStr.split(":").map(Number);
        if (!isNaN(hour)) {
          hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
        }
      }
    });

    return Array.from(hourMap.entries())
      .map(([hour, count]) => ({
        hour,
        time: `${hour.toString().padStart(2, "0")}:00`,
        count,
      }))
      .sort((a, b) => a.hour - b.hour);
  }, [bookings]);

  // Calculate approval rate and status breakdown
  const approvalStats = useMemo(() => {
    const total = bookings.length;
    const approved = bookings.filter((b) => b.status === "APPROVED").length;
    const pending = bookings.filter((b) => b.status === "PENDING").length;
    const rejected = bookings.filter((b) => b.status === "REJECTED").length;
    const cancelled = bookings.filter((b) => b.status === "CANCELLED").length;

    return {
      total,
      approved,
      pending,
      rejected,
      cancelled,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
    };
  }, [bookings]);

  // Get max values for scaling charts
  const maxBookingsPerResource = Math.max(
    ...bookingsPerResource.map((b) => b.count),
    1
  );
  const maxBookingsOverTime = Math.max(
    ...bookingsOverTime.map((b) => b.count),
    1
  );
  const maxPeakHours = Math.max(...peakHours.map((b) => b.count), 1);

  return (
    <div className="booking-analytics">
      <h2 className="analytics-title">Booking Analytics</h2>

      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Bookings</p>
          <p className="stat-value">{approvalStats.total}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Approval Rate</p>
          <p className="stat-value approval-rate">{approvalStats.approvalRate}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Approved</p>
          <p className="stat-value approved">{approvalStats.approved}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Pending</p>
          <p className="stat-value pending">{approvalStats.pending}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Rejected</p>
          <p className="stat-value rejected">{approvalStats.rejected}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Bookings Per Resource */}
        <div className="chart-card">
          <h3 className="chart-title">Bookings Per Resource</h3>
          <div className="bar-chart">
            {bookingsPerResource.length > 0 ? (
              bookingsPerResource.map((item) => (
                <div key={item.resourceId} className="bar-item">
                  <div className="bar-label">{item.resourceName}</div>
                  <div className="bar-container">
                    <div
                      className="bar"
                      style={{
                        width: `${(item.count / maxBookingsPerResource) * 100}%`,
                      }}
                    />
                    <span className="bar-value">{item.count}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No booking data available</p>
            )}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="chart-card">
          <h3 className="chart-title">Peak Hours</h3>
          <div className="bar-chart">
            {peakHours.length > 0 ? (
              peakHours.map((item) => (
                <div key={item.hour} className="bar-item">
                  <div className="bar-label">{item.time}</div>
                  <div className="bar-container">
                    <div
                      className="bar peak-bar"
                      style={{
                        width: `${(item.count / maxPeakHours) * 100}%`,
                      }}
                    />
                    <span className="bar-value">{item.count}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No hourly data available</p>
            )}
          </div>
        </div>

        {/* Bookings Over Time */}
        <div className="chart-card full-width">
          <h3 className="chart-title">Bookings Over Time (Last 30 Days)</h3>
          <div className="line-chart-container">
            <div className="line-chart">
              {bookingsOverTime.length > 0 ? (
                <div className="chart-area">
                  {bookingsOverTime.map((item, idx) => (
                    <div key={item.date} className="chart-point-wrapper">
                      <div
                        className="chart-point"
                        style={{
                          height: `${(item.count / maxBookingsOverTime) * 100}%`,
                        }}
                        title={`${item.date}: ${item.count} bookings`}
                      />
                      {idx % 5 === 0 && (
                        <span className="chart-label">{item.date}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No time-series data available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .booking-analytics {
          padding: 2rem;
          background: white;
          border-radius: 8px;
          margin-top: 2rem;
        }

        .analytics-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 2rem 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          padding: 1.25rem;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 8px;
          border: 1px solid #e0e7ff;
          text-align: center;
        }

        .stat-label {
          margin: 0;
          font-size: 0.875rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .stat-value {
          margin: 0.75rem 0 0 0;
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .stat-value.approval-rate {
          color: #059669;
        }

        .stat-value.approved {
          color: #059669;
        }

        .stat-value.pending {
          color: #d97706;
        }

        .stat-value.rejected {
          color: #dc2626;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .chart-card {
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .chart-card.full-width {
          grid-column: 1 / -1;
        }

        .chart-title {
          margin: 0 0 1.5rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
        }

        .bar-chart {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .bar-item {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .bar-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #4b5563;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .bar-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          height: 24px;
          background: #ffffff;
          border-radius: 4px;
          padding: 0 0.75rem;
          border: 1px solid #e5e7eb;
        }

        .bar {
          height: 16px;
          background: linear-gradient(90deg, #3b82f6 0%, #1e40af 100%);
          border-radius: 3px;
          transition: width 0.3s ease;
          min-width: 2px;
        }

        .bar.peak-bar {
          background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
        }

        .bar-value {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          white-space: nowrap;
        }

        .line-chart-container {
          background: white;
          border-radius: 6px;
          padding: 1.5rem 1rem;
          border: 1px solid #e5e7eb;
          overflow-x: auto;
        }

        .line-chart {
          min-width: 100%;
        }

        .chart-area {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 200px;
          gap: 4px;
        }

        .chart-point-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          gap: 0.5rem;
        }

        .chart-point {
          width: 100%;
          background: linear-gradient(180deg, #10b981 0%, #059669 100%);
          border-radius: 2px 2px 0 0;
          min-height: 2px;
          transition: background-color 0.2s ease;
        }

        .chart-point:hover {
          background: linear-gradient(180deg, #34d399 0%, #10b981 100%);
          opacity: 0.8;
        }

        .chart-label {
          font-size: 0.7rem;
          color: #9ca3af;
          white-space: nowrap;
          transform: rotate(-45deg);
          transform-origin: center;
          margin-top: 0.5rem;
        }

        .no-data {
          text-align: center;
          color: #9ca3af;
          padding: 2rem;
          margin: 0;
        }

        @media (max-width: 1024px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }

          .chart-card.full-width {
            grid-column: 1;
          }
        }
      `}</style>
    </div>
  );
}
