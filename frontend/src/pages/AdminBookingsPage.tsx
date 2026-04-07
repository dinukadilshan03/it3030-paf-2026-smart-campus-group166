import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  approveBooking,
  rejectBooking,
  getBookings,
  type BookingRecord,
} from '../services/bookingService';

type TabType = 'pending' | 'approved' | 'rejected';

interface ApprovalAction {
  bookingId: number;
  reason: string;
}

export function AdminBookingsPage() {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  // State for approval/rejection dialogs
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<ApprovalAction | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  // Filter bookings by status
  const filteredBookings = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return bookings.filter((b) => b.status === 'PENDING');
      case 'approved':
        return bookings.filter((b) => b.status === 'APPROVED');
      case 'rejected':
        return bookings.filter((b) => b.status === 'REJECTED');
      default:
        return bookings;
    }
  }, [bookings, activeTab]);

  // Calculate statistics
  const stats = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((b) => b.status === 'PENDING').length,
      approved: bookings.filter((b) => b.status === 'APPROVED').length,
      rejected: bookings.filter((b) => b.status === 'REJECTED').length,
    }),
    [bookings]
  );

  const loadBookings = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await getBookings();
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleApproveClick = (bookingId: number) => {
    setActionType('approve');
    setPendingAction({ bookingId, reason: '' });
    setShowReasonDialog(true);
  };

  const handleRejectClick = (bookingId: number) => {
    setActionType('reject');
    setPendingAction({ bookingId, reason: '' });
    setShowReasonDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    setError('');
    setActionInProgress(pendingAction.bookingId);

    try {
      if (actionType === 'approve') {
        await approveBooking(pendingAction.bookingId, pendingAction.reason);
        setSuccessMessage('Booking approved successfully!');
      } else {
        await rejectBooking(pendingAction.bookingId, pendingAction.reason);
        setSuccessMessage('Booking rejected successfully!');
      }

      setShowReasonDialog(false);
      setPendingAction(null);

      // Reload bookings
      await loadBookings();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionInProgress(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat('en-LK', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  return (
    <div className="page-shell">
      <div className="app-shell">
        <header className="topbar panel">
          <div>
            <span className="eyebrow">Admin</span>
            <h1>Booking Management</h1>
            <p>
              Signed in as {user?.name} ({user?.role})
            </p>
          </div>
          <div className="button-row">
            <Link className="secondary-button" to="/app">
              Dashboard
            </Link>
            <button className="secondary-button" onClick={loadBookings} disabled={isLoading}>
              Refresh
            </button>
            <button className="ghost-button" onClick={() => logout()}>
              Sign Out
            </button>
          </div>
        </header>

        {error && <div className="status-banner error">{error}</div>}
        {successMessage && <div className="status-banner success">{successMessage}</div>}

        <section className="stat-row">
          <div className="stat-card">
            <p className="stat-label">Total Bookings</p>
            <p className="stat-value">{stats.total}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Pending</p>
            <p className="stat-value" style={{ color: '#ff9f43' }}>
              {stats.pending}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Approved</p>
            <p className="stat-value" style={{ color: '#2ed573' }}>
              {stats.approved}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Rejected</p>
            <p className="stat-value" style={{ color: '#ff5e78' }}>
              {stats.rejected}
            </p>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({stats.pending})
          </button>
          <button
            className={`tab-button ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Approved ({stats.approved})
          </button>
          <button
            className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            Rejected ({stats.rejected})
          </button>
        </div>

        {/* Bookings List */}
        <section className="bookings-section">
          {isLoading ? (
            <p className="muted">Loading bookings...</p>
          ) : filteredBookings.length === 0 ? (
            <p className="muted">
              No {activeTab} bookings found.
            </p>
          ) : (
            <div className="bookings-grid">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="booking-card panel">
                  <div className="booking-header">
                    <div>
                      <h3>
                        <strong>{booking.resource?.name ?? 'Unknown Resource'}</strong>
                      </h3>
                      <p className="booking-meta">
                        Location: {booking.resource?.location ?? '-'}
                      </p>
                    </div>
                    <span
                      className={`status-badge status-${booking.status.toLowerCase()}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="booking-details">
                    <div className="detail-row">
                      <span className="label">Student:</span>
                      <span className="value">
                        {booking.user?.name ?? 'Unknown'}
                        <br />
                        <span style={{ fontSize: '0.9em', color: '#666' }}>
                          {booking.user?.email ?? '-'}
                        </span>
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="label">Start Time:</span>
                      <span className="value">{formatDateTime(booking.startTime)}</span>
                    </div>

                    <div className="detail-row">
                      <span className="label">End Time:</span>
                      <span className="value">{formatDateTime(booking.endTime)}</span>
                    </div>

                    {booking.expectedAttendees && (
                      <div className="detail-row">
                        <span className="label">Expected Attendees:</span>
                        <span className="value">{booking.expectedAttendees}</span>
                      </div>
                    )}

                    {booking.purpose && (
                      <div className="detail-row">
                        <span className="label">Purpose:</span>
                        <span className="value">{booking.purpose}</span>
                      </div>
                    )}

                    {booking.approvalReason && (
                      <div className="detail-row">
                        <span className="label">Reason:</span>
                        <span className="value">{booking.approvalReason}</span>
                      </div>
                    )}

                    {booking.checkedIn && (
                      <div className="detail-row">
                        <span className="label">Checked In:</span>
                        <span className="value">
                          {booking.checkInTime ? formatDateTime(booking.checkInTime) : 'Yes'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons - Only for Pending */}
                  {activeTab === 'pending' && (
                    <div className="booking-actions">
                      <button
                        className="primary-button"
                        onClick={() => handleApproveClick(booking.id)}
                        disabled={actionInProgress === booking.id}
                      >
                        {actionInProgress === booking.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        className="danger-button"
                        onClick={() => handleRejectClick(booking.id)}
                        disabled={actionInProgress === booking.id}
                      >
                        {actionInProgress === booking.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Action Confirmation Dialog */}
      {showReasonDialog && pendingAction && (
        <div className="modal-overlay" onClick={() => setShowReasonDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {actionType === 'approve' ? 'Approve Booking' : 'Reject Booking'}
            </h2>
            <p>
              {actionType === 'approve'
                ? 'Are you sure you want to approve this booking?'
                : 'Are you sure you want to reject this booking?'}
            </p>

            <div className="field">
              <label>
                {actionType === 'approve' ? 'Approval' : 'Rejection'} Reason (optional)
                <textarea
                  rows={4}
                  value={pendingAction.reason}
                  onChange={(e) =>
                    setPendingAction({ ...pendingAction, reason: e.target.value })
                  }
                  placeholder={
                    actionType === 'approve'
                      ? 'Enter approval notes...'
                      : 'Enter rejection reason...'
                  }
                />
              </label>
            </div>

            <div className="button-row">
              <button
                className={actionType === 'approve' ? 'primary-button' : 'danger-button'}
                onClick={handleConfirmAction}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
              <button className="secondary-button" onClick={() => setShowReasonDialog(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .tabs-container {
          display: flex;
          gap: 1rem;
          padding: 0 1.5rem 1rem;
          border-bottom: 1px solid #e0e0e0;
          background-color: #fafafa;
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

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 1rem;
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
          margin: 1rem 1.5rem 0;
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
        }
      `}</style>
    </div>
  );
}
