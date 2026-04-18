"use client";

import type { BookingSummaryResponse } from "@/lib/bookings/types";

interface BookingListProps {
  bookings: BookingSummaryResponse[];
  isLoading: boolean;
  onBookingClick?: (booking: BookingSummaryResponse) => void;
  showActions?: boolean;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onCancel?: (id: number) => void;
  actionInProgress?: number | null;
}

export function BookingList({
  bookings,
  isLoading,
  onBookingClick,
  showActions = false,
  onApprove,
  onReject,
  onCancel,
  actionInProgress,
}: BookingListProps) {
  const formatTime = (timeString?: string) => {
    if (!timeString) return "-";
    try {
      const [hours, minutes] = timeString.split(":");
      return `${hours}:${minutes}`;
    } catch {
      return timeString;
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return <p className="muted">Loading bookings...</p>;
  }

  if (bookings.length === 0) {
    return <p className="muted">No bookings found.</p>;
  }

  return (
    <div className="booking-list">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className={`booking-card panel ${onBookingClick ? "clickable" : ""}`}
          onClick={() => onBookingClick?.(booking)}
        >
          <div className="booking-header">
            <div>
              <h3>
                <strong>{booking.resourceName}</strong>
              </h3>
              <p className="booking-meta">Code: {booking.resourceCode}</p>
            </div>
            <span className={`status-badge status-${booking.status.toLowerCase()}`}>
              {booking.status}
            </span>
          </div>

          <div className="booking-details">
            <div className="detail-row">
              <span className="label">Requester:</span>
              <span className="value">{booking.requesterDisplayName}</span>
            </div>

            <div className="detail-row">
              <span className="label">Booking Date:</span>
              <span className="value">{booking.bookingDate}</span>
            </div>

            <div className="detail-row">
              <span className="label">Time:</span>
              <span className="value">
                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
              </span>
            </div>

            {booking.expectedAttendees && (
              <div className="detail-row">
                <span className="label">Expected Attendees:</span>
                <span className="value">{booking.expectedAttendees}</span>
              </div>
            )}

            <div className="detail-row">
              <span className="label">Created:</span>
              <span className="value">{formatDateTime(booking.createdAt)}</span>
            </div>
          </div>

          {showActions && (
            <div className="booking-actions">
              {booking.status === "PENDING" && (
                <>
                  {onApprove && (
                    <button
                      className="primary-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApprove(booking.id);
                      }}
                      disabled={actionInProgress === booking.id}
                    >
                      {actionInProgress === booking.id ? "Processing..." : "Approve"}
                    </button>
                  )}
                  {onReject && (
                    <button
                      className="danger-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReject(booking.id);
                      }}
                      disabled={actionInProgress === booking.id}
                    >
                      {actionInProgress === booking.id ? "Processing..." : "Reject"}
                    </button>
                  )}
                </>
              )}
              {(booking.status === "PENDING" || booking.status === "APPROVED") && onCancel && (
                <button
                  className="secondary-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(booking.id);
                  }}
                  disabled={actionInProgress === booking.id}
                >
                  {actionInProgress === booking.id ? "Processing..." : "Cancel"}
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      <style jsx>{`
        .booking-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .booking-card {
          padding: 1.75rem;
          border: 1px solid rgba(91, 76, 243, 0.15);
          border-radius: 0.875rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(91, 76, 243, 0.02) 100%);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
        }

        .booking-card.clickable {
          cursor: pointer;
        }

        .booking-card.clickable:hover {
          box-shadow: 0 8px 32px rgba(91, 76, 243, 0.15);
          border-color: rgba(91, 76, 243, 0.3);
          transform: translateY(-2px);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(91, 76, 243, 0.04) 100%);
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
          gap: 1rem;
        }

        .booking-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(135deg, #5b4cf3 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.25px;
        }

        .booking-meta {
          margin: 0.375rem 0 0;
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        .status-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 0.625rem;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          white-space: nowrap;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .status-badge.status-pending {
          background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
          color: white;
        }

        .status-badge.status-approved {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .status-badge.status-rejected {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .status-badge.status-cancelled {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
          color: white;
        }

        .booking-details {
          margin-bottom: 1.25rem;
        }

        .detail-row {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 1rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(91, 76, 243, 0.08);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-row .label {
          font-weight: 700;
          color: #475569;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.25px;
          color: var(--primary);
        }

        .detail-row .value {
          color: #1e293b;
          font-size: 0.9375rem;
          font-weight: 500;
        }

        .booking-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .booking-actions button {
          padding: 0.65rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          border: none;
          border-radius: 0.625rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .primary-button {
          background: linear-gradient(135deg, #5b4cf3 0%, #7c63f8 100%);
          color: white;
        }

        .primary-button:hover:not(:disabled) {
          box-shadow: 0 4px 16px rgba(91, 76, 243, 0.3);
          transform: translateY(-2px);
        }

        .danger-button {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .danger-button:hover:not(:disabled) {
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
          transform: translateY(-2px);
        }

        .secondary-button {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
          color: white;
        }

        .secondary-button:hover:not(:disabled) {
          box-shadow: 0 4px 16px rgba(71, 85, 105, 0.3);
          transform: translateY(-2px);
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .muted {
          color: #94a3b8;
          text-align: center;
          padding: 3rem 2rem;
          font-size: 1rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
