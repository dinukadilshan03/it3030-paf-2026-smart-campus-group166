"use client";

import type { BookingDetailResponse } from "@/lib/bookings/types";

interface BookingDetailPanelProps {
  booking: BookingDetailResponse;
  isLoading?: boolean;
  onClose?: () => void;
  showActions?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  actionInProgress?: boolean;
}

export function BookingDetailPanel({
  booking,
  isLoading = false,
  onClose,
  showActions = false,
  onApprove,
  onReject,
  onCancel,
  actionInProgress = false,
}: BookingDetailPanelProps) {
  const formatDateTime = (dateString?: string) => {
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

  const formatTime = (timeString?: string) => {
    if (!timeString) return "-";
    try {
      const [hours, minutes] = timeString.split(":");
      return `${hours}:${minutes}`;
    } catch {
      return timeString;
    }
  };

  if (isLoading) {
    return (
      <div className="booking-detail-panel">
        <p>Loading booking details...</p>
      </div>
    );
  }

  return (
    <div className="booking-detail-panel">
      <div className="panel-header">
        <h2>{booking.resourceName}</h2>
        <span className={`status-badge status-${booking.status.toLowerCase()}`}>
          {booking.status}
        </span>
      </div>

      <div className="panel-body">
        <section className="detail-section">
          <h3>Resource Information</h3>
          <div className="detail-group">
            <div className="detail-item">
              <span className="label">Resource Code:</span>
              <span className="value">{booking.resourceCode}</span>
            </div>
            <div className="detail-item">
              <span className="label">Location:</span>
              <span className="value">{booking.locationName}</span>
            </div>
          </div>
        </section>

        <section className="detail-section">
          <h3>Requester Information</h3>
          <div className="detail-group">
            <div className="detail-item">
              <span className="label">Name:</span>
              <span className="value">{booking.requesterDisplayName}</span>
            </div>
            <div className="detail-item">
              <span className="label">Email:</span>
              <span className="value">{booking.requesterEmail}</span>
            </div>
          </div>
        </section>

        <section className="detail-section">
          <h3>Booking Details</h3>
          <div className="detail-group">
            <div className="detail-item">
              <span className="label">Booking Date:</span>
              <span className="value">{booking.bookingDate}</span>
            </div>
            <div className="detail-item">
              <span className="label">Start Time:</span>
              <span className="value">{formatTime(booking.startTime)}</span>
            </div>
            <div className="detail-item">
              <span className="label">End Time:</span>
              <span className="value">{formatTime(booking.endTime)}</span>
            </div>
            {booking.expectedAttendees && (
              <div className="detail-item">
                <span className="label">Expected Attendees:</span>
                <span className="value">{booking.expectedAttendees}</span>
              </div>
            )}
            {booking.purpose && (
              <div className="detail-item">
                <span className="label">Purpose:</span>
                <span className="value">{booking.purpose}</span>
              </div>
            )}
            {booking.requestNotes && (
              <div className="detail-item">
                <span className="label">Notes:</span>
                <span className="value">{booking.requestNotes}</span>
              </div>
            )}
          </div>
        </section>

        {booking.status === "APPROVED" && booking.reviewedAt && (
          <section className="detail-section">
            <h3>Approval Information</h3>
            <div className="detail-group">
              <div className="detail-item">
                <span className="label">Approved By:</span>
                <span className="value">{booking.reviewedByDisplayName || "-"}</span>
              </div>
              <div className="detail-item">
                <span className="label">Approved At:</span>
                <span className="value">{formatDateTime(booking.reviewedAt)}</span>
              </div>
              {booking.reviewReason && (
                <div className="detail-item">
                  <span className="label">Approval Notes:</span>
                  <span className="value">{booking.reviewReason}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {booking.status === "REJECTED" && booking.reviewedAt && (
          <section className="detail-section">
            <h3>Rejection Information</h3>
            <div className="detail-group">
              <div className="detail-item">
                <span className="label">Rejected By:</span>
                <span className="value">{booking.reviewedByDisplayName || "-"}</span>
              </div>
              <div className="detail-item">
                <span className="label">Rejected At:</span>
                <span className="value">{formatDateTime(booking.reviewedAt)}</span>
              </div>
              {booking.reviewReason && (
                <div className="detail-item">
                  <span className="label">Rejection Reason:</span>
                  <span className="value">{booking.reviewReason}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {booking.status === "CANCELLED" && booking.cancelledAt && (
          <section className="detail-section">
            <h3>Cancellation Information</h3>
            <div className="detail-group">
              <div className="detail-item">
                <span className="label">Cancelled By:</span>
                <span className="value">{booking.cancelledByDisplayName || "-"}</span>
              </div>
              <div className="detail-item">
                <span className="label">Cancelled At:</span>
                <span className="value">{formatDateTime(booking.cancelledAt)}</span>
              </div>
              {booking.cancellationReason && (
                <div className="detail-item">
                  <span className="label">Cancellation Reason:</span>
                  <span className="value">{booking.cancellationReason}</span>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="detail-section">
          <h3>Metadata</h3>
          <div className="detail-group">
            <div className="detail-item">
              <span className="label">Created At:</span>
              <span className="value">{formatDateTime(booking.createdAt)}</span>
            </div>
            <div className="detail-item">
              <span className="label">Updated At:</span>
              <span className="value">{formatDateTime(booking.updatedAt)}</span>
            </div>
          </div>
        </section>

        {showActions && (
          <div className="panel-actions">
            {booking.status === "PENDING" && (
              <>
                {onApprove && (
                  <button
                    className="primary-button"
                    onClick={onApprove}
                    disabled={actionInProgress}
                  >
                    {actionInProgress ? "Processing..." : "Approve"}
                  </button>
                )}
                {onReject && (
                  <button
                    className="danger-button"
                    onClick={onReject}
                    disabled={actionInProgress}
                  >
                    {actionInProgress ? "Processing..." : "Reject"}
                  </button>
                )}
              </>
            )}
            {(booking.status === "PENDING" || booking.status === "APPROVED") && onCancel && (
              <button
                className="secondary-button"
                onClick={onCancel}
                disabled={actionInProgress}
              >
                {actionInProgress ? "Processing..." : "Cancel"}
              </button>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .booking-detail-panel {
          padding: 1.5rem;
          background: white;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .panel-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .status-badge {
          display: inline-block;
          padding: 0.375rem 1rem;
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

        .panel-body {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .detail-section h3 {
          margin: 0 0 1rem;
          font-size: 1rem;
          color: #333;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-group {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-item .label {
          font-weight: 600;
          color: #666;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .detail-item .value {
          color: #333;
          font-size: 0.95rem;
          word-break: break-word;
        }

        .panel-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          padding: 1rem;
          background-color: #f9f9f9;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
        }

        .panel-actions button {
          padding: 0.625rem 1.25rem;
          font-size: 0.875rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
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
      `}</style>
    </div>
  );
}
