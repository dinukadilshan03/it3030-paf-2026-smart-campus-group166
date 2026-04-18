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
          padding: 2rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(91, 76, 243, 0.02) 100%);
          border-radius: 1rem;
          border: 1px solid rgba(91, 76, 243, 0.15);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(10px);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid rgba(91, 76, 243, 0.15);
        }

        .panel-header h2 {
          margin: 0;
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(135deg, #5b4cf3 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }

        .status-badge {
          display: inline-block;
          padding: 0.5rem 1.25rem;
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

        .panel-body {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .detail-section h3 {
          margin: 0 0 1.25rem;
          font-size: 1.0625rem;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #5b4cf3;
        }

        .detail-group {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(91, 76, 243, 0.04);
          border-radius: 0.625rem;
          border-left: 3px solid #5b4cf3;
        }

        .detail-item .label {
          font-weight: 700;
          color: #475569;
          font-size: 0.8125rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-item .value {
          color: #1e293b;
          font-size: 1rem;
          font-weight: 500;
          word-break: break-word;
        }

        .panel-actions {
          display: flex;
          gap: 0.875rem;
          flex-wrap: wrap;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(91, 76, 243, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%);
          border-radius: 0.875rem;
          border: 1px solid rgba(91, 76, 243, 0.15);
        }

        .panel-actions button {
          padding: 0.75rem 1.5rem;
          font-size: 0.875rem;
          border: none;
          border-radius: 0.625rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 700;
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
      `}</style>
    </div>
  );
}
