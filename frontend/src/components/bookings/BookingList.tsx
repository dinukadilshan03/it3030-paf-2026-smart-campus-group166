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
          padding: 1.5rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          background: white;
          transition: all 0.2s ease;
        }

        .booking-card.clickable {
          cursor: pointer;
        }

        .booking-card.clickable:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-color: #0066cc;
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          gap: 1rem;
        }

        .booking-header h3 {
          margin: 0;
          font-size: 1.125rem;
        }

        .booking-meta {
          margin: 0.25rem 0 0;
          font-size: 0.875rem;
          color: #666;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .status-badge.status-pending {
          background-color: #fff3cd;
          color: #856404;
        }

        .status-badge.status-approved {
          background-color: #d4edda;
          color: #155724;
        }

        .status-badge.status-rejected {
          background-color: #f8d7da;
          color: #721c24;
        }

        .status-badge.status-cancelled {
          background-color: #e2e3e5;
          color: #383d41;
        }

        .booking-details {
          margin-bottom: 1rem;
        }

        .detail-row {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 1rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-row .label {
          font-weight: 500;
          color: #666;
          font-size: 0.875rem;
        }

        .detail-row .value {
          color: #333;
          font-size: 0.875rem;
        }

        .booking-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .booking-actions button {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .primary-button {
          background-color: #0066cc;
          color: white;
        }

        .primary-button:hover:not(:disabled) {
          background-color: #0052a3;
        }

        .danger-button {
          background-color: #dc3545;
          color: white;
        }

        .danger-button:hover:not(:disabled) {
          background-color: #c82333;
        }

        .secondary-button {
          background-color: #6c757d;
          color: white;
        }

        .secondary-button:hover:not(:disabled) {
          background-color: #5a6268;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .muted {
          color: #999;
          text-align: center;
          padding: 2rem;
        }
      `}</style>
    </div>
  );
}
