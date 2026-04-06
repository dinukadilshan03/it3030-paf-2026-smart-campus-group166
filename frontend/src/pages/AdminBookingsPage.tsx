import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  createBooking,
  deleteBooking,
  getBookingById,
  getBookings,
  updateBooking,
  type BookingRecord,
} from '../services/bookingService';
import { getAllResources, type Resource } from '../services/resourceService';
import { getUsers } from '../services/userService';
import type { User } from '../types/auth';

interface BookingFormState {
  resourceId: string;
  userId: string;
  startTime: string;
  endTime: string;
  purpose: string;
  expectedAttendees: string;
  status: string;
}

const emptyForm: BookingFormState = {
  resourceId: '',
  userId: '',
  startTime: '',
  endTime: '',
  purpose: '',
  expectedAttendees: '',
  status: 'PENDING',
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function toDateTimeLocalValue(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 16);
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function AdminBookingsPage() {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<BookingFormState>(emptyForm);
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const stats = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((entry) => entry.status === 'PENDING').length,
      approved: bookings.filter((entry) => entry.status === 'APPROVED').length,
      rejected: bookings.filter((entry) => entry.status === 'REJECTED').length,
    }),
    [bookings]
  );

  const loadData = async (selectedId?: number | null) => {
    setIsLoading(true);
    setError('');

    try {
      const [bookingRows, resourceRows, userRows] = await Promise.all([
        getBookings(),
        getAllResources(),
        getUsers({ role: undefined, status: undefined, search: undefined }),
      ]);

      setBookings(bookingRows);
      setResources(resourceRows);
      setUsers(userRows);

      if (selectedId) {
        const detail = await getBookingById(selectedId);
        setSelectedBooking(detail);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load booking data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData().catch(() => undefined);
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingBookingId(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.resourceId || !form.userId || !form.startTime || !form.endTime) {
      setError('Resource, user, start time, and end time are required.');
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      const commonPayload = {
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose.trim() || undefined,
        expectedAttendees: form.expectedAttendees ? Number(form.expectedAttendees) : undefined,
      };

      if (editingBookingId) {
        await updateBooking(editingBookingId, {
          ...commonPayload,
          status: form.status.trim() || undefined,
        });
      } else {
        await createBooking({
          resourceId: Number(form.resourceId),
          userId: Number(form.userId),
          ...commonPayload,
        });
      }

      const selectedId = editingBookingId ?? selectedBooking?.id ?? null;
      resetForm();
      await loadData(selectedId);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save booking.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (booking: BookingRecord) => {
    setEditingBookingId(booking.id);
    setForm({
      resourceId: booking.resource?.id ? String(booking.resource.id) : '',
      userId: booking.user?.userId ? String(booking.user.userId) : '',
      startTime: toDateTimeLocalValue(booking.startTime),
      endTime: toDateTimeLocalValue(booking.endTime),
      purpose: booking.purpose ?? '',
      expectedAttendees: booking.expectedAttendees ? String(booking.expectedAttendees) : '',
      status: booking.status,
    });
  };

  const handleDelete = async (bookingId: number) => {
    if (!window.confirm('Delete this booking?')) {
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      await deleteBooking(bookingId);
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(null);
      }
      if (editingBookingId === bookingId) {
        resetForm();
      }
      await loadData(selectedBooking?.id === bookingId ? null : selectedBooking?.id);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete booking.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleView = async (bookingId: number) => {
    setError('');

    try {
      const detail = await getBookingById(bookingId);
      setSelectedBooking(detail);
    } catch (viewError) {
      setError(viewError instanceof Error ? viewError.message : 'Failed to load booking details.');
    }
  };

  return (
    <div className="page-shell">
      <div className="app-shell">
        <header className="topbar panel">
          <div>
            <span className="eyebrow">Booking</span>
            <h1>Booking management</h1>
            <p>
              Signed in as {user?.name} ({user?.role})
            </p>
          </div>
          <div className="button-row">
            <Link className="secondary-button" to="/app">
              Dashboard
            </Link>
            <button className="secondary-button" onClick={() => loadData(selectedBooking?.id)}>
              Refresh
            </button>
            <button className="ghost-button" onClick={() => logout()}>
              Sign Out
            </button>
          </div>
        </header>

        {error ? <div className="status-banner error">{error}</div> : null}

        <section className="stat-row">
          <div className="stat-card">
            <p className="stat-label">Total bookings</p>
            <p className="stat-value">{stats.total}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Pending</p>
            <p className="stat-value">{stats.pending}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Approved</p>
            <p className="stat-value">{stats.approved}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Rejected</p>
            <p className="stat-value">{stats.rejected}</p>
          </div>
        </section>

        <div className="layout-grid">
          <aside className="panel">
            <span className="eyebrow">{editingBookingId ? 'Update booking' : 'Create booking'}</span>
            <h2 className="section-title">{editingBookingId ? 'Edit booking' : 'Add booking'}</h2>

            <form className="stack" onSubmit={handleSubmit}>
              <div className="field">
                <label>
                  Resource
                  <select
                    value={form.resourceId}
                    onChange={(event) => setForm((current) => ({ ...current, resourceId: event.target.value }))}
                    disabled={Boolean(editingBookingId)}
                    required
                  >
                    <option value="">Select resource</option>
                    {resources.map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name} ({resource.location})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="field">
                <label>
                  Student
                  <select
                    value={form.userId}
                    onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}
                    disabled={Boolean(editingBookingId)}
                    required
                  >
                    <option value="">Select user</option>
                    {users.map((entry) => (
                      <option key={entry.userId} value={entry.userId}>
                        {entry.name} ({entry.email})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="field-grid two-col">
                <div className="field">
                  <label>
                    Start time
                    <input
                      type="datetime-local"
                      value={form.startTime}
                      onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
                      required
                    />
                  </label>
                </div>
                <div className="field">
                  <label>
                    End time
                    <input
                      type="datetime-local"
                      value={form.endTime}
                      onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="field-grid two-col">
                <div className="field">
                  <label>
                    Expected attendees
                    <input
                      type="number"
                      min={1}
                      value={form.expectedAttendees}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, expectedAttendees: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <div className="field">
                  <label>
                    Status
                    <select
                      value={form.status}
                      onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                      disabled={!editingBookingId}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="field">
                <label>
                  Purpose
                  <textarea
                    rows={3}
                    value={form.purpose}
                    onChange={(event) => setForm((current) => ({ ...current, purpose: event.target.value }))}
                  />
                </label>
              </div>

              <div className="button-row">
                <button className="primary-button" type="submit" disabled={isSaving || isLoading}>
                  {editingBookingId ? 'Update booking' : 'Create booking'}
                </button>
                {editingBookingId ? (
                  <button className="secondary-button" type="button" onClick={resetForm}>
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>
          </aside>

          <section className="table-panel">
            <span className="eyebrow">Bookings</span>
            <h2 className="section-title">All bookings</h2>

            {isLoading ? (
              <p className="muted">Loading bookings...</p>
            ) : bookings.length === 0 ? (
              <p className="muted">No bookings found.</p>
            ) : (
              <div className="table-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Resource</th>
                      <th>Student</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>{booking.id}</td>
                        <td>{booking.resource?.name ?? '-'}</td>
                        <td>{booking.user?.name ?? '-'}</td>
                        <td>{formatDateTime(booking.startTime)}</td>
                        <td>{formatDateTime(booking.endTime)}</td>
                        <td>
                          <span className={`badge booking-status-${booking.status}`}>{booking.status}</span>
                        </td>
                        <td>
                          <div className="button-row">
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() => handleView(booking.id)}
                            >
                              View
                            </button>
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() => handleEdit(booking)}
                            >
                              Edit
                            </button>
                            <button
                              className="ghost-button"
                              type="button"
                              onClick={() => handleDelete(booking.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {selectedBooking ? (
          <section className="panel">
            <span className="eyebrow">Booking detail</span>
            <h2 className="section-title">Booking #{selectedBooking.id}</h2>
            <div className="field-grid two-col">
              <div>
                <p className="muted">
                  <strong>Resource:</strong> {selectedBooking.resource?.name ?? '-'}
                </p>
                <p className="muted">
                  <strong>Student:</strong> {selectedBooking.user?.name ?? '-'} ({selectedBooking.user?.email ?? '-'})
                </p>
                <p className="muted">
                  <strong>Status:</strong> {selectedBooking.status}
                </p>
              </div>
              <div>
                <p className="muted">
                  <strong>Purpose:</strong> {selectedBooking.purpose || 'Not provided'}
                </p>
                <p className="muted">
                  <strong>Attendees:</strong> {selectedBooking.expectedAttendees ?? '-'}
                </p>
                <p className="muted">
                  <strong>Reason:</strong> {selectedBooking.approvalReason || 'N/A'}
                </p>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
