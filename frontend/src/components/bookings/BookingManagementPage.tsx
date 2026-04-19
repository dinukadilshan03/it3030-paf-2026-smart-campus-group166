"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { CheckCircle, Trash2, XCircle } from "lucide-react";
import type { BookingSummaryResponse, BookingFilters } from "@/lib/bookings/types";
import type { CurrentUser } from "@/types/auth";
import type { Resource } from "@/lib/resources/types";
import {
  cancelBookingClient,
  deleteBookingClient,
  listBookingsClient,
  reviewBookingClient,
} from "@/lib/bookings/client";
import { getResources } from "@/lib/resources/api";
import NLBookingInput from "@/components/booking/NLBookingInput";
import { BookingAnalytics } from "./BookingAnalytics";
import { CreateBookingForm } from "./CreateBookingForm";
import { BookingCalendar } from "./BookingCalendar";
import { BookingFiltersPanel } from "./BookingFiltersPanel";

interface ReviewAction {
  bookingId: number;
  reason: string;
  decision: "APPROVE" | "REJECT" | "CANCEL" | "DELETE";
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

function canDeleteBooking(status: BookingSummaryResponse["status"]) {
  return status === "PENDING";
}

function canCancelBooking(status: BookingSummaryResponse["status"]) {
  return status === "APPROVED";
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

  // State for advanced filters (admin only)
  const [advancedFilters, setAdvancedFilters] = useState<BookingFilters>({});

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

  const loadBookings = useCallback(
    async (filters?: BookingFilters) => {
      setIsLoading(true);
      setError("");

      try {
        const data = await listBookingsClient(filters);
        setBookings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bookings");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

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
    if (isAdmin) {
      // For admin, load with filters
      loadBookings(advancedFilters);
    } else {
      // For students, load without filters
      loadBookings();
    }
    loadResources();
  }, [isAdmin, advancedFilters, loadBookings]);

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

  const handleDeleteClick = (bookingId: number) => {
    setPendingAction({
      bookingId,
      reason: "",
      decision: "DELETE",
    });
    setShowReviewDialog(true);
  };

  const handleConfirmReview = async () => {
    if (!pendingAction) return;

    setError("");
    setActionInProgress(pendingAction.bookingId);

    try {
      const reason = pendingAction.reason.trim() || undefined;

      if (pendingAction.decision === "CANCEL") {
        await cancelBookingClient(pendingAction.bookingId, {
          reason,
        });
      } else if (pendingAction.decision === "DELETE") {
        await deleteBookingClient(pendingAction.bookingId, reason ? { reason } : undefined);
      } else {
        await reviewBookingClient(pendingAction.bookingId, {
          decision: pendingAction.decision,
          reason,
        });
      }

      let message = "";
      if (pendingAction.decision === "CANCEL") {
        message = "Booking cancelled successfully!";
      } else if (pendingAction.decision === "DELETE") {
        message = "Booking deleted successfully!";
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

          <div className="tabs-container-wrapper">
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
            <BookingFiltersPanel
              resources={resources}
              onFiltersChange={setAdvancedFilters}
              isLoading={isLoading}
            />
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
                      {(canDeleteBooking(booking.status) || canCancelBooking(booking.status)) && (
                        <>
                          {canDeleteBooking(booking.status) && (
                            <button
                              className="icon-button delete-icon"
                              onClick={() => handleDeleteClick(booking.id)}
                              title="Delete booking"
                              disabled={actionInProgress === booking.id}
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                          {canCancelBooking(booking.status) && (
                            <button
                              className="icon-button cancel-icon"
                              onClick={() => handleStudentCancelClick(booking.id)}
                              title="Cancel booking"
                              disabled={actionInProgress === booking.id}
                            >
                              <XCircle size={18} />
                            </button>
                          )}
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
                    <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-slate-100 border-t-2 border-t-slate-200 flex gap-3">
                      <button
                        onClick={() => handleApproveClick(booking.id)}
                        disabled={actionInProgress === booking.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-100 to-teal-100 border-2 border-emerald-300 text-emerald-800 rounded-lg font-semibold text-sm hover:from-emerald-200 hover:to-teal-200 hover:border-emerald-500 hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {actionInProgress === booking.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-700 rounded-full animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={18} className="flex-shrink-0" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectClick(booking.id)}
                        disabled={actionInProgress === booking.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-100 to-rose-100 border-2 border-red-300 text-red-800 rounded-lg font-semibold text-sm hover:from-red-200 hover:to-rose-200 hover:border-red-500 hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {actionInProgress === booking.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-red-300 border-t-red-700 rounded-full animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <XCircle size={18} className="flex-shrink-0" />
                            Reject
                          </>
                        )}
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
                      {(canDeleteBooking(booking.status) || canCancelBooking(booking.status)) && (
                        <>
                          {canDeleteBooking(booking.status) && (
                            <button
                              className="icon-button delete-icon"
                              onClick={() => handleDeleteClick(booking.id)}
                              title="Delete booking"
                              disabled={actionInProgress === booking.id}
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                          {canCancelBooking(booking.status) && (
                            <button
                              className="icon-button cancel-icon"
                              onClick={() => handleStudentCancelClick(booking.id)}
                              title="Cancel booking"
                              disabled={actionInProgress === booking.id}
                            >
                              <XCircle size={18} />
                            </button>
                          )}
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
                  : pendingAction.decision === "DELETE"
                    ? "Delete Booking"
                    : "Cancel Booking"}
            </h2>
            <p>
              {pendingAction.decision === "APPROVE"
                ? "Are you sure you want to approve this booking?"
                : pendingAction.decision === "REJECT"
                  ? "Are you sure you want to reject this booking?"
                  : pendingAction.decision === "DELETE"
                    ? "Are you sure you want to delete this booking?"
                    : "Are you sure you want to cancel this booking?"}
            </p>

            <div className="field">
              <label>
                {pendingAction.decision === "APPROVE"
                  ? "Approval"
                  : pendingAction.decision === "REJECT"
                    ? "Rejection"
                    : pendingAction.decision === "DELETE"
                      ? "Deletion"
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
                        : pendingAction.decision === "DELETE"
                          ? "Enter deletion reason..."
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
                    : pendingAction.decision === "DELETE"
                      ? "Delete booking"
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
          background: linear-gradient(180deg, rgba(248, 246, 244, 0.6) 0%, rgba(245, 243, 241, 0.4) 50%, rgba(255, 255, 255, 0.8) 100%);
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
          background: linear-gradient(135deg, #8B9DB5 0%, #7A92A8 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(139, 157, 181, 0.35);
        }

        .primary-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #7A92A8 0%, #6B7F95 100%);
          box-shadow: 0 6px 16px rgba(139, 157, 181, 0.4);
          transform: translateY(-1px);
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
          background: linear-gradient(135deg, rgba(248, 246, 244, 0.6) 0%, rgba(245, 243, 241, 0.4) 100%);
          padding: 1.5rem;
          border-radius: 12px;
          border: 2px solid rgba(139, 157, 181, 0.3);
          text-align: center;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          border-color: rgba(139, 157, 181, 0.6);
          box-shadow: 0 6px 20px rgba(139, 157, 181, 0.1);
          transform: translateY(-2px);
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
          gap: 0.75rem;
          padding: 1.5rem 1.5rem;
          background: transparent;
          flex-wrap: wrap;
          border-radius: 8px;
          margin: 0;
          align-items: center;
        }

        .tabs-container-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 1.5rem;
          margin: 0 1.5rem 1.5rem;
          flex-wrap: wrap;
        }

        .tab-button {
          padding: 0.7rem 1.2rem;
          border: 1px solid rgba(139, 157, 181, 0.4);
          background: linear-gradient(135deg, rgba(248, 246, 244, 0.8) 0%, rgba(245, 243, 241, 0.8) 100%);
          color: #6B7280;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .tab-button:hover {
          background: linear-gradient(135deg, rgba(245, 243, 241, 0.95) 0%, rgba(243, 241, 239, 0.95) 100%);
          border-color: rgba(139, 157, 181, 0.7);
          transform: translateY(-2px);
        }

        .tab-button.active {
          background: linear-gradient(135deg, #8B9DB5 0%, #7A92A8 100%);
          color: white;
          border-color: #6B7F95;
          box-shadow: 0 4px 12px rgba(139, 157, 181, 0.35);
        }

        .bookings-section {
          padding: 1rem 1.5rem 2rem;
          flex: 1;
          background: transparent;
        }

        .bookings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .booking-card {
          border: 2px solid rgba(139, 157, 181, 0.3);
          border-radius: 12px;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(248, 246, 244, 0.8) 0%, rgba(245, 243, 241, 0.8) 100%);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(139, 157, 181, 0.08);
        }

        .booking-card:hover {
          border-color: rgba(139, 157, 181, 0.6);
          box-shadow: 0 8px 24px rgba(139, 157, 181, 0.12);
          transform: translateY(-2px);
        }

        .booking-highlighted {
          border-color: #8B9DB5;
          box-shadow: 0 0 0 4px rgba(139, 157, 181, 0.15);
          background: linear-gradient(135deg, rgba(245, 243, 241, 0.9) 0%, rgba(242, 240, 238, 0.9) 100%);
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          border-bottom: 2px solid rgba(139, 157, 181, 0.2);
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
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%);
          color: #92400e;
          border: 1px solid rgba(245, 158, 11, 0.5);
        }

        .status-approved {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%);
          color: #065f46;
          border: 1px solid rgba(34, 197, 94, 0.5);
        }

        .status-rejected {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%);
          color: #7f1d1d;
          border: 1px solid rgba(239, 68, 68, 0.5);
        }

        .status-cancelled {
          background: linear-gradient(135deg, rgba(107, 114, 128, 0.2) 0%, rgba(75, 85, 99, 0.2) 100%);
          color: #1f2937;
          border: 1px solid rgba(107, 114, 128, 0.5);
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
          background: linear-gradient(135deg, rgba(248, 246, 244, 0.6) 0%, rgba(245, 243, 241, 0.4) 100%);
          border: 2px solid rgba(139, 157, 181, 0.3);
          margin-bottom: 1.5rem;
          border-radius: 12px;
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
          background: linear-gradient(135deg, rgba(248, 246, 244, 0.6) 0%, rgba(245, 243, 241, 0.4) 100%);
          border: 2px solid rgba(139, 157, 181, 0.3);
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 16px rgba(139, 157, 181, 0.08);
        }
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
