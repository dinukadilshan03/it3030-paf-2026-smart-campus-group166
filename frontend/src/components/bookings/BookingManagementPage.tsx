"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import type { BookingSummaryResponse } from "@/lib/bookings/types";
import type { CurrentUser } from "@/types/auth";
import type { Resource } from "@/lib/resources/types";
import { cancelBookingClient, listBookingsClient, reviewBookingClient } from "@/lib/bookings/client";
import { getResources } from "@/lib/resources/api";
import NLBookingInput from "@/components/booking/NLBookingInput";
import { BookingAnalytics } from "./BookingAnalytics";
import { CreateBookingForm } from "./CreateBookingForm";
import { BookingCalendar } from "./BookingCalendar";

interface ReviewAction {
  bookingId: number;
  reason: string;
  decision: "APPROVE" | "REJECT" | "CANCEL";
}

type TabType = "pending" | "approved" | "rejected" | "cancelled" | "all";

interface BookingManagementPageProps {
  user: CurrentUser;
  initialHighlightedBookingId?: number | null;
}

function getTabForStatus(status: BookingSummaryResponse["status"]): TabType {
  switch (status) {
    case "PENDING":
      return "pending";
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "CANCELLED":
      return "cancelled";
    default:
      return "all";
  }
}

export function BookingManagementPage({
  user,
  initialHighlightedBookingId = null,
}: BookingManagementPageProps) {
  const [bookings, setBookings] = useState<BookingSummaryResponse[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [highlightedBookingId, setHighlightedBookingId] = useState<number | null>(
    initialHighlightedBookingId,
  );

  // State for review dialogs
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<ReviewAction | null>(null);

  // State for create booking form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [calendarSelection, setCalendarSelection] = useState<{
    date: string;
    startTime: string;
    endTime: string;
    resourceId?: number;
  } | null>(null);

  // State for analytics
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Check if user is admin
  const isAdmin = user.role === "ADMIN";

  // Filter bookings by status
  const filteredBookings = useMemo(() => {
    switch (activeTab) {
      case "pending":
        return bookings.filter((b) => b.status === "PENDING");
      case "approved":
        return bookings.filter((b) => b.status === "APPROVED");
      case "rejected":
        return bookings.filter((b) => b.status === "REJECTED");
      case "cancelled":
        return bookings.filter((b) => b.status === "CANCELLED");
      case "all":
        return bookings;
      default:
        return bookings;
    }
  }, [bookings, activeTab]);

  // Calculate statistics
  const stats = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "PENDING").length,
      approved: bookings.filter((b) => b.status === "APPROVED").length,
      rejected: bookings.filter((b) => b.status === "REJECTED").length,
      cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
    }),
    [bookings]
  );

  const loadBookings = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await listBookingsClient();
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const loadResources = async () => {
    try {
      const data = await getResources();
      setResources(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load resources:", err);
      setResources([]);
    }
  };

  useEffect(() => {
    loadBookings();
    loadResources();
  }, []);

  useEffect(() => {
    if (initialHighlightedBookingId == null || bookings.length === 0) {
      return;
    }

    const targetBooking = bookings.find((booking) => booking.id === initialHighlightedBookingId);
    if (!targetBooking) {
      return;
    }

    if (isAdmin) {
      setActiveTab(getTabForStatus(targetBooking.status));
    }
    setViewMode("list");
    setHighlightedBookingId(targetBooking.id);

    const scrollTimer = window.setTimeout(() => {
      document
        .getElementById(`booking-card-${targetBooking.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    const clearTimer = window.setTimeout(() => setHighlightedBookingId(null), 5000);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [bookings, initialHighlightedBookingId, isAdmin]);

  const handleApproveClick = (bookingId: number) => {
    setPendingAction({
      bookingId,
      reason: "",
      decision: "APPROVE",
    });
    setShowReviewDialog(true);
  };

  const handleRejectClick = (bookingId: number) => {
    setPendingAction({
      bookingId,
      reason: "",
      decision: "REJECT",
    });
    setShowReviewDialog(true);
  };

  const handleStudentCancelClick = (bookingId: number) => {
    setPendingAction({
      bookingId,
      reason: "",
      decision: "CANCEL",
    });
    setShowReviewDialog(true);
  };

  const handleConfirmReview = async () => {
    if (!pendingAction) return;

    setError("");
    setActionInProgress(pendingAction.bookingId);

    try {
      if (pendingAction.decision === "CANCEL") {
        await cancelBookingClient(pendingAction.bookingId, {
          reason: pendingAction.reason.trim() || undefined,
        });
      } else {
        await reviewBookingClient(pendingAction.bookingId, {
          decision: pendingAction.decision,
          reason: pendingAction.reason.trim() || undefined,
        });
      }

      let message = "";
      if (pendingAction.decision === "CANCEL") {
        message = "Booking cancelled successfully!";
      } else if (pendingAction.decision === "APPROVE") {
        message = "Booking approved successfully!";
      } else {
        message = "Booking rejected successfully!";
      }
      setSuccessMessage(message);

      setShowReviewDialog(false);
      setPendingAction(null);

      // Reload bookings
      await loadBookings();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCalendarSlotClick = (
    date: string,
    startTime: string,
    endTime: string,
    resourceId?: number
  ) => {
    // Pre-fill the form with calendar selection
    setCalendarSelection({
      date,
      startTime,
      endTime,
      resourceId,
    });
    setShowCreateForm(true);
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

  const formatTime = (timeString?: string) => {
    if (!timeString) return "-";
    try {
      const [hours, minutes] = timeString.split(":");
      return `${hours}:${minutes}`;
    } catch {
      return timeString;
    }
  };

  return (
    <div className="admin-bookings-page">
      {error && <div className="status-banner error">{error}</div>}
      {successMessage && <div className="status-banner success">{successMessage}</div>}

      {isAdmin && (
        <>
          <section className="stat-row">
            <div className="stat-card">
              <p className="stat-label">Total Bookings</p>
              <p className="stat-value">{stats.total}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Pending</p>
              <p className="stat-value pending">{stats.pending}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Approved</p>
              <p className="stat-value approved">{stats.approved}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Rejected</p>
              <p className="stat-value rejected">{stats.rejected}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Cancelled</p>
              <p className="stat-value cancelled">{stats.cancelled}</p>
            </div>
          </section>

          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("pending");
                setShowAnalytics(false);
              }}
            >
              Pending ({stats.pending})
            </button>
            <button
              className={`tab-button ${activeTab === "approved" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("approved");
                setShowAnalytics(false);
              }}
            >
              Approved ({stats.approved})
            </button>
            <button
              className={`tab-button ${activeTab === "rejected" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("rejected");
                setShowAnalytics(false);
              }}
            >
              Rejected ({stats.rejected})
            </button>
            <button
              className={`tab-button ${activeTab === "cancelled" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("cancelled");
                setShowAnalytics(false);
              }}
            >
              Cancelled ({stats.cancelled})
            </button>
            <button
              className={`tab-button ${activeTab === "all" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("all");
                setShowAnalytics(false);
              }}
            >
              All ({stats.total})
            </button>
            <button
              className={`tab-button analytics-tab ${showAnalytics ? "active" : ""}`}
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              📊 Analytics
            </button>
          </div>
        </>
      )}

      {isAdmin ? (
        <section className="bookings-section">
          {showAnalytics ? (
            <BookingAnalytics bookings={bookings} resources={resources} />
          ) : isLoading ? (
            <p className="muted">Loading bookings...</p>
          ) : filteredBookings.length === 0 ? (
            <p className="muted">No {activeTab !== "all" ? activeTab : ""} bookings found.</p>
          ) : (
            <div className="bookings-grid">
              {filteredBookings.map((booking) => (
                <div
                  id={`booking-card-${booking.id}`}
                  key={booking.id}
                  className={`booking-card panel ${
                    highlightedBookingId === booking.id ? "booking-highlighted" : ""
                  }`}
                >
                  <div className="booking-header">
                    <div>
                      <h3>
                        <strong>{booking.resourceName}</strong>
                      </h3>
                      <p className="booking-meta">Code: {booking.resourceCode}</p>
                    </div>
                    <div className="header-actions">
                      <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                        {booking.status}
                      </span>
                      {(booking.status === "APPROVED" || booking.status === "PENDING") && (
                        <>
                          <button
                            className="icon-button cancel-icon"
                            onClick={() => handleStudentCancelClick(booking.id)}
                            title="Cancel booking"
                            disabled={actionInProgress === booking.id}
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </div>
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

                  {/* Action Buttons - Only for Pending */}
                  {activeTab === "pending" && (
                    <div className="booking-actions">
                      <button
                        className="primary-button"
                        onClick={() => handleApproveClick(booking.id)}
                        disabled={actionInProgress === booking.id}
                      >
                        {actionInProgress === booking.id ? "Processing..." : "Approve"}
                      </button>
                      <button
                        className="danger-button"
                        onClick={() => handleRejectClick(booking.id)}
                        disabled={actionInProgress === booking.id}
                      >
                        {actionInProgress === booking.id ? "Processing..." : "Reject"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="bookings-section">
          <div className="student-header">
            <div>
              <h2>My Bookings</h2>
              <p>Create and manage your resource bookings</p>
            </div>
            <div className="student-header-actions">
              <div className="view-toggle-group">
                <button
                  className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                >
                  List View
                </button>
                <button
                  className={`view-toggle-btn ${viewMode === "calendar" ? "active" : ""}`}
                  onClick={() => setViewMode("calendar")}
                >
                  Calendar View
                </button>
              </div>
              <button
                className="primary-button"
                onClick={() => {
                  setShowCreateForm(!showCreateForm);
                  if (showCreateForm) {
                    setCalendarSelection(null);
                  }
                }}
              >
                {showCreateForm ? "Hide Form" : "+ Create New Booking"}
              </button>
            </div>
          </div>

          {showCreateForm && (
            <div className="create-form-container">
              <div className="ai-booking-section">
                <NLBookingInput
                  onSuccess={(message) => {
                    setSuccessMessage(message);
                    setShowCreateForm(false);
                    setCalendarSelection(null);
                    loadBookings();
                    setTimeout(() => setSuccessMessage(""), 3000);
                  }}
                  onError={(err) => setError(err)}
                  onSubmit={() => {
                    setShowCreateForm(false);
                    setCalendarSelection(null);
                    loadBookings();
                  }}
                />
              </div>

              <div className="form-divider">
                <span>Or fill the booking manually</span>
              </div>

              <CreateBookingForm
                initialDate={calendarSelection?.date}
                initialStartTime={calendarSelection?.startTime}
                initialEndTime={calendarSelection?.endTime}
                initialResourceId={calendarSelection?.resourceId}
                onSuccess={(message) => {
                  setSuccessMessage(message);
                  setShowCreateForm(false);
                  setCalendarSelection(null);
                  loadBookings();
                  setTimeout(() => setSuccessMessage(""), 3000);
                }}
                onError={(err) => setError(err)}
                onSubmit={() => {
                  setShowCreateForm(false);
                  setCalendarSelection(null);
                  loadBookings();
                }}
              />
            </div>
          )}

          {isLoading ? (
            <p className="muted">Loading your bookings...</p>
          ) : viewMode === "calendar" ? (
            <BookingCalendar
              bookings={bookings}
              resources={resources}
              onSlotClick={handleCalendarSlotClick}
            />
          ) : bookings.length === 0 ? (
            <p className="muted">You haven&apos;t created any bookings yet.</p>
          ) : (
            <div className="bookings-grid">
              {bookings.map((booking) => (
                <div
                  id={`booking-card-${booking.id}`}
                  key={booking.id}
                  className={`booking-card panel ${
                    highlightedBookingId === booking.id ? "booking-highlighted" : ""
                  }`}
                >
                  <div className="booking-header">
                    <div>
                      <h3>
                        <strong>{booking.resourceName}</strong>
                      </h3>
                      <p className="booking-meta">Code: {booking.resourceCode}</p>
                    </div>
                    <div className="header-actions">
                      <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                        {booking.status}
                      </span>
                      {(booking.status === "APPROVED" || booking.status === "PENDING") && (
                        <>
                          <button
                            className="icon-button cancel-icon"
                            onClick={() => handleStudentCancelClick(booking.id)}
                            title="Cancel booking"
                            disabled={actionInProgress === booking.id}
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="booking-details">
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
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Review Confirmation Dialog */}
      {showReviewDialog && pendingAction && (
        <div className="modal-overlay" onClick={() => setShowReviewDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {pendingAction.decision === "APPROVE"
                ? "Approve Booking"
                : pendingAction.decision === "REJECT"
                  ? "Reject Booking"
                  : "Cancel Booking"}
            </h2>
            <p>
              {pendingAction.decision === "APPROVE"
                ? "Are you sure you want to approve this booking?"
                : pendingAction.decision === "REJECT"
                  ? "Are you sure you want to reject this booking?"
                  : "Are you sure you want to cancel this booking?"}
            </p>

            <div className="field">
              <label>
                {pendingAction.decision === "APPROVE"
                  ? "Approval"
                  : pendingAction.decision === "REJECT"
                    ? "Rejection"
                    : "Cancellation"}{" "}
                Reason (optional)
                <textarea
                  rows={4}
                  value={pendingAction.reason}
                  onChange={(e) =>
                    setPendingAction({ ...pendingAction, reason: e.target.value })
                  }
                  placeholder={
                    pendingAction.decision === "APPROVE"
                      ? "Enter approval notes..."
                      : pendingAction.decision === "REJECT"
                        ? "Enter rejection reason..."
                        : "Enter cancellation reason..."
                  }
                />
              </label>
            </div>

            <div className="button-row">
              <button
                className={
                  pendingAction.decision === "APPROVE"
                    ? "primary-button"
                    : "danger-button"
                }
                onClick={handleConfirmReview}
              >
                {pendingAction.decision === "APPROVE"
                  ? "Approve"
                  : pendingAction.decision === "REJECT"
                    ? "Reject"
                    : "Cancel booking"}
              </button>
              <button
                className="secondary-button"
                onClick={() => setShowReviewDialog(false)}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-bookings-page {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background-color: #f5f5f5;
        }

        .admin-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
          padding: 1.5rem;
          background: white;
          border-bottom: 1px solid #e0e0e0;
          margin-bottom: 1.5rem;
        }

        .admin-topbar h1 {
          margin: 0.5rem 0 0;
          font-size: 1.8rem;
        }

        .eyebrow {
          font-size: 0.85rem;
          color: #666;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .admin-topbar p {
          margin: 0.25rem 0 0;
          color: #666;
          font-size: 0.95rem;
        }

        .button-row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .primary-button,
        .danger-button,
        .secondary-button {
          padding: 0.6rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-block;
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
          background-color: #e0e0e0;
          color: #333;
        }

        .secondary-button:hover:not(:disabled) {
          background-color: #d0d0d0;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .stat-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          padding: 0 1.5rem 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          text-align: center;
        }

        .stat-label {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .stat-value {
          margin: 0.5rem 0 0;
          font-size: 1.8rem;
          font-weight: 700;
          color: #333;
        }

        .stat-value.pending {
          color: #ff9f43;
        }

        .stat-value.approved {
          color: #2ed573;
        }

        .stat-value.rejected {
          color: #ff5e78;
        }

        .stat-value.cancelled {
          color: #95a5a6;
        }

        .tabs-container {
          display: flex;
          gap: 1rem;
          padding: 0 1.5rem 1rem;
          border-bottom: 1px solid #e0e0e0;
          background-color: white;
          flex-wrap: wrap;
        }

        .tab-button {
          padding: 0.75rem 1rem;
          border: none;
          background: none;
          color: #666;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s ease;
        }

        .tab-button:hover {
          color: #333;
        }

        .tab-button.active {
          color: #0066cc;
          border-bottom-color: #0066cc;
        }

        .bookings-section {
          padding: 2rem 1.5rem;
          flex: 1;
        }

        .bookings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .booking-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 1.5rem;
          background: white;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .booking-highlighted {
          border-color: #14b8a6;
          box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.15);
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 1rem;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .icon-button {
          background: none;
          border: none;
          padding: 0.4rem;
          cursor: pointer;
          color: #666;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .icon-button:hover:not(:disabled) {
          background-color: #f5f5f5;
          color: #d32f2f;
        }

        .icon-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .icon-button.delete-icon {
          color: #d32f2f;
        }

        .icon-button.cancel-icon {
          color: #ff9800;
        }

        .icon-button.cancel-icon:hover:not(:disabled) {
          color: #f57c00;
        }

        .booking-header h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .booking-meta {
          margin: 0.5rem 0 0;
          color: #666;
          font-size: 0.9rem;
        }

        .status-badge {
          padding: 0.4rem 0.8rem;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-pending {
          background-color: #fff3cd;
          color: #856404;
        }

        .status-approved {
          background-color: #d4edda;
          color: #155724;
        }

        .status-rejected {
          background-color: #f8d7da;
          color: #721c24;
        }

        .status-cancelled {
          background-color: #e2e3e5;
          color: #383d41;
        }

        .booking-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex: 1;
        }

        .detail-row {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 1rem;
          font-size: 0.95rem;
        }

        .detail-row .label {
          font-weight: 600;
          color: #333;
        }

        .detail-row .value {
          color: #666;
        }

        .booking-actions {
          display: flex;
          gap: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #f0f0f0;
          justify-content: flex-start;
        }

        .booking-actions button {
          flex: 1;
          padding: 0.6rem 1rem;
          font-size: 0.9rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          padding: 2rem;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .modal-content h2 {
          margin: 0 0 1rem;
          font-size: 1.3rem;
        }

        .modal-content p {
          margin: 0 0 1.5rem;
          color: #666;
        }

        .field {
          margin-bottom: 1.5rem;
        }

        .field label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-weight: 500;
          color: #333;
        }

        .field textarea {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          font-size: 0.95rem;
          resize: vertical;
        }

        .field textarea:focus {
          outline: none;
          border-color: #0066cc;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .muted {
          color: #999;
          text-align: center;
          padding: 2rem;
          font-style: italic;
        }

        .status-banner {
          padding: 1rem 1.5rem;
          border-radius: 4px;
          margin: 0 1.5rem 1rem;
        }

        .status-banner.error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .status-banner.success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .student-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
          padding: 1.5rem;
          background: white;
          border-bottom: 1px solid #e0e0e0;
          margin-bottom: 1.5rem;
          border-radius: 8px;
        }

        .student-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #333;
        }

        .student-header p {
          margin: 0.5rem 0 0;
          color: #666;
          font-size: 0.9rem;
        }

        .create-form-container {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .ai-booking-section {
          margin-bottom: 2rem;
        }

        .form-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 0 0 2rem;
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .form-divider::before,
        .form-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        .student-header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .view-toggle-group {
          display: flex;
          gap: 0.5rem;
          background: #f3f4f6;
          padding: 0.25rem;
          border-radius: 0.375rem;
        }

        .view-toggle-btn {
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.875rem;
          color: #6b7280;
          border-radius: 0.25rem;
          transition: all 0.2s ease;
        }

        .view-toggle-btn:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #374151;
        }

        .view-toggle-btn.active {
          background: white;
          color: #1f2937;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
          .bookings-grid {
            grid-template-columns: 1fr;
          }

          .detail-row {
            grid-template-columns: 1fr;
            gap: 0.25rem;
          }

          .booking-actions {
            flex-direction: column;
          }

          .modal-content {
            width: 95%;
          }

          .admin-topbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .button-row {
            width: 100%;
          }

          .student-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .student-header-actions {
            width: 100%;
            flex-direction: column-reverse;
          }

          .student-header-actions > button {
            width: 100%;
          }

          .view-toggle-group {
            width: 100%;
          }

          .view-toggle-btn {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}
