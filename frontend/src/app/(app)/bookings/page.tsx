"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BookingSummaryResponse } from "@/lib/bookings/types";

type TabType = "pending" | "approved" | "rejected" | "cancelled" | "all";

interface ReviewAction {
  bookingId: number;
  reason: string;
  decision: "APPROVE" | "REJECT";
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<ReviewAction | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  useEffect(() => {
    const loadData = async () => {
      try {
        const userResponse = await fetch("/api/v1/auth/me", {
          credentials: "include",
        });

        if (!userResponse.ok) {
          router.push("/login");
          return;
        }

        const user = await userResponse.json();
        setCurrentUser(user);

        if (!user.authenticated || user.role !== "ADMIN") {
          router.push("/dashboard");
          return;
        }

        const response = await fetch("/api/v1/bookings", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load bookings");
        }

        const data = (await response.json()) as BookingSummaryResponse[];
        setBookings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bookings");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router]);

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

  const handleConfirmReview = async () => {
    if (!pendingAction) return;

    setError("");
    setActionInProgress(pendingAction.bookingId);

    try {
      const response = await fetch(`/api/v1/bookings/${pendingAction.bookingId}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          decision: pendingAction.decision,
          reason: pendingAction.reason || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(errorData.message || "Failed to review booking");
      }

      const decision = pendingAction.decision === "APPROVE" ? "approved" : "rejected";
      setSuccessMessage(`Booking ${decision} successfully!`);

      setShowReviewDialog(false);
      setPendingAction(null);

      const listResponse = await fetch("/api/v1/bookings", {
        credentials: "include",
      });

      if (listResponse.ok) {
        const updatedBookings = (await listResponse.json()) as BookingSummaryResponse[];
        setBookings(updatedBookings);
      }

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionInProgress(null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (!currentUser?.authenticated || currentUser.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4 flex justify-between items-start gap-8">
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Admin</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">Booking Management</h1>
            <p className="text-gray-600 text-sm mt-1">
              Signed in as {currentUser.displayName} ({currentUser.role})
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Dashboard
            </Link>
            <button
              onClick={() => {
                setIsLoading(true);
                setError("");
                fetch("/api/v1/bookings", { credentials: "include" })
                  .then((res) => res.json())
                  .then((data) => setBookings(data))
                  .catch((err) => setError(err.message))
                  .finally(() => setIsLoading(false));
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {successMessage}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-6 py-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Total Bookings</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Pending</p>
          <p className="text-3xl font-bold text-amber-500 mt-2">{stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Approved</p>
          <p className="text-3xl font-bold text-green-500 mt-2">{stats.approved}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Rejected</p>
          <p className="text-3xl font-bold text-red-500 mt-2">{stats.rejected}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-medium">Cancelled</p>
          <p className="text-3xl font-bold text-gray-500 mt-2">{stats.cancelled}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white px-6">
        <div className="flex gap-1 flex-wrap">
          {(["pending", "approved", "rejected", "cancelled", "all"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors capitalize ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab} ({tab === "pending" ? stats.pending : tab === "approved" ? stats.approved : tab === "rejected" ? stats.rejected : tab === "cancelled" ? stats.cancelled : stats.total})
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Grid */}
      <div className="px-6 py-8">
        {isLoading ? (
          <p className="text-center text-gray-500 italic">Loading bookings...</p>
        ) : filteredBookings.length === 0 ? (
          <p className="text-center text-gray-500 italic">
            No {activeTab !== "all" ? activeTab : ""} bookings found.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Card Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{booking.resourceName}</h3>
                    <p className="text-gray-600 text-sm mt-1">Code: {booking.resourceCode}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>

                {/* Card Content */}
                <div className="px-6 py-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm font-medium">Requester:</span>
                    <span className="text-gray-900 text-sm">{booking.requesterDisplayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm font-medium">Booking Date:</span>
                    <span className="text-gray-900 text-sm">{booking.bookingDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm font-medium">Time:</span>
                    <span className="text-gray-900 text-sm">
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </span>
                  </div>
                  {booking.expectedAttendees && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm font-medium">Expected Attendees:</span>
                      <span className="text-gray-900 text-sm">{booking.expectedAttendees}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm font-medium">Created:</span>
                    <span className="text-gray-900 text-sm">{formatDateTime(booking.createdAt)}</span>
                  </div>
                </div>

                {/* Card Actions */}
                {activeTab === "pending" && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                    <button
                      onClick={() => handleApproveClick(booking.id)}
                      disabled={actionInProgress === booking.id}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {actionInProgress === booking.id ? "Processing..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleRejectClick(booking.id)}
                      disabled={actionInProgress === booking.id}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {actionInProgress === booking.id ? "Processing..." : "Reject"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      {showReviewDialog && pendingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowReviewDialog(false)}>
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {pendingAction.decision === "APPROVE" ? "Approve Booking" : "Reject Booking"}
              </h2>
            </div>

            <div className="px-6 py-4">
              <p className="text-gray-600 mb-4">
                {pendingAction.decision === "APPROVE"
                  ? "Are you sure you want to approve this booking?"
                  : "Are you sure you want to reject this booking?"}
              </p>

              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-2">
                  {pendingAction.decision === "APPROVE" ? "Approval" : "Rejection"} Reason (optional)
                </span>
                <textarea
                  rows={4}
                  value={pendingAction.reason}
                  onChange={(e) =>
                    setPendingAction({ ...pendingAction, reason: e.target.value })
                  }
                  placeholder={
                    pendingAction.decision === "APPROVE"
                      ? "Enter approval notes..."
                      : "Enter rejection reason..."
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </label>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleConfirmReview}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                  pendingAction.decision === "APPROVE"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {pendingAction.decision === "APPROVE" ? "Approve" : "Reject"}
              </button>
              <button
                onClick={() => setShowReviewDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
