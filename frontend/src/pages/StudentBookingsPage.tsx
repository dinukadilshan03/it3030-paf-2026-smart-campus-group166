import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getAllResources, type Resource } from '../services/resourceService';
import { createBooking, getBookings, type BookingRecord } from '../services/bookingService';
import BookingModal from '../components/BookingModal';

export function StudentBookingsPage() {
  const { user, logout } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  // Get unique resource types for filters
  const resourceTypes = useMemo(() => {
    const types = new Set(resources.map((r) => r.type || 'Uncategorized'));
    return Array.from(types).sort();
  }, [resources]);

  // Filter and search resources
  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesSearch =
        !searchQuery ||
        resource.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.location?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterType === 'all' || resource.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [resources, searchQuery, filterType]);

  // Get student's bookings
  const studentBookings = useMemo(() => {
    return bookings.filter((b) => b.user?.userId === user?.userId);
  }, [bookings, user?.userId]);

  // Count bookings by status
  const bookingStats = useMemo(
    () => ({
      pending: studentBookings.filter((b) => b.status === 'PENDING').length,
      approved: studentBookings.filter((b) => b.status === 'APPROVED').length,
      rejected: studentBookings.filter((b) => b.status === 'REJECTED').length,
    }),
    [studentBookings]
  );

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [resourcesData, bookingsData] = await Promise.all([
        getAllResources(),
        getBookings(),
      ]);
      setResources(resourcesData);
      setBookings(bookingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenBooking = (resource: Resource) => {
    setSelectedResource(resource);
    setShowBookingModal(true);
  };

  const handleBooking = async (bookingData: {
    startTime: string;
    endTime: string;
    purpose?: string;
    expectedAttendees?: number;
  }) => {
    if (!selectedResource || !user) return;

    try {
      await createBooking({
        resourceId: Number(selectedResource.id),
        userId: Number(user.userId),
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        purpose: bookingData.purpose,
        expectedAttendees: bookingData.expectedAttendees,
      });

      setSuccessMessage('Booking created successfully! Waiting for approval.');
      setShowBookingModal(false);
      setSelectedResource(null);

      // Reload bookings
      await loadData();

      // Clear success message after 4 seconds
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
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
        {/* Header */}
        <header className="topbar panel">
          <div>
            <span className="eyebrow">Student</span>
            <h1>Resource Booking</h1>
            <p>Browse and book available campus resources</p>
          </div>
          <div className="button-row">
            <button className="secondary-button" onClick={loadData} disabled={isLoading}>
              Refresh
            </button>
            <button className="ghost-button" onClick={() => logout()}>
              Sign Out
            </button>
          </div>
        </header>

        {error && <div className="status-banner error">{error}</div>}
        {successMessage && <div className="status-banner success">{successMessage}</div>}

        {/* My Bookings Stats */}
        <section className="stat-row">
          <div className="stat-card">
            <p className="stat-label">My Bookings</p>
            <p className="stat-value">{studentBookings.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Pending Approval</p>
            <p className="stat-value" style={{ color: '#ff9f43' }}>
              {bookingStats.pending}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Approved</p>
            <p className="stat-value" style={{ color: '#2ed573' }}>
              {bookingStats.approved}
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Rejected</p>
            <p className="stat-value" style={{ color: '#ff5e78' }}>
              {bookingStats.rejected}
            </p>
          </div>
        </section>

        {/* Browse & Book Section */}
        <section className="browse-section">
          <div className="browse-header">
            <div>
              <span className="eyebrow">Browse Resources</span>
              <h2 className="section-title">Available Resources</h2>
            </div>
            <div className="search-filter-row">
              <input
                type="text"
                placeholder="Search by name, type, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <p className="muted">Loading resources...</p>
          ) : filteredResources.length === 0 ? (
            <p className="muted">No resources found matching your search.</p>
          ) : (
            <div className="resources-grid">
              {filteredResources.map((resource) => (
                <div key={resource.id} className="resource-card">
                  <div className="resource-image-placeholder">
                    <div className="resource-icon">
                      {resource.type === 'Lecture Hall' && '🏛️'}
                      {resource.type === 'Lab' && '🧪'}
                      {resource.type === 'Meeting Room' && '🤝'}
                      {resource.type === 'Computer Lab' && '💻'}
                      {!['Lecture Hall', 'Lab', 'Meeting Room', 'Computer Lab'].includes(
                        resource.type || ''
                      ) && '📍'}
                    </div>
                    <div className="resource-status">
                      <span className={`status-badge status-${resource.status?.toLowerCase() || 'available'}`}>
                        {resource.status || 'Available'}
                      </span>
                    </div>
                  </div>

                  <div className="resource-content">
                    <h3 className="resource-name">{resource.name}</h3>

                    <div className="resource-meta">
                      {resource.type && (
                        <div className="meta-item">
                          <span className="label">Type:</span>
                          <span className="value">{resource.type}</span>
                        </div>
                      )}
                      {resource.location && (
                        <div className="meta-item">
                          <span className="label">Location:</span>
                          <span className="value">{resource.location}</span>
                        </div>
                      )}
                      {resource.capacity && (
                        <div className="meta-item">
                          <span className="label">Capacity:</span>
                          <span className="value">{resource.capacity} people</span>
                        </div>
                      )}
                    </div>

                    {resource.description && (
                      <p className="resource-description">{resource.description}</p>
                    )}

                    <button
                      className="book-button"
                      onClick={() => handleOpenBooking(resource)}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* My Bookings List */}
        {studentBookings.length > 0 && (
          <section className="my-bookings-section">
            <span className="eyebrow">My Bookings</span>
            <h2 className="section-title">Your Bookings</h2>

            <div className="bookings-tabs">
              {/* Pending Bookings */}
              {studentBookings.filter((b) => b.status === 'PENDING').length > 0 && (
                <div className="bookings-group">
                  <h3 className="group-title pending">⏳ Pending Approval</h3>
                  <div className="bookings-list pending-list">
                    {studentBookings
                      .filter((b) => b.status === 'PENDING')
                      .map((booking) => (
                        <div key={booking.id} className="booking-item pending">
                          <div className="booking-info">
                            <h4>{booking.resource?.name}</h4>
                            <p className="booking-dates">
                              {formatDateTime(booking.startTime)} to {formatDateTime(booking.endTime)}
                            </p>
                            {booking.purpose && <p className="booking-purpose">Purpose: {booking.purpose}</p>}
                          </div>
                          <span className="status-badge pending">Pending</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Approved Bookings */}
              {studentBookings.filter((b) => b.status === 'APPROVED').length > 0 && (
                <div className="bookings-group">
                  <h3 className="group-title approved">✅ Approved</h3>
                  <div className="bookings-list approved-list">
                    {studentBookings
                      .filter((b) => b.status === 'APPROVED')
                      .map((booking) => (
                        <div key={booking.id} className="booking-item approved">
                          <div className="booking-info">
                            <h4>{booking.resource?.name}</h4>
                            <p className="booking-dates">
                              {formatDateTime(booking.startTime)} to {formatDateTime(booking.endTime)}
                            </p>
                            {booking.purpose && <p className="booking-purpose">Purpose: {booking.purpose}</p>}
                          </div>
                          <span className="status-badge approved">Approved</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Rejected Bookings */}
              {studentBookings.filter((b) => b.status === 'REJECTED').length > 0 && (
                <div className="bookings-group">
                  <h3 className="group-title rejected">❌ Rejected</h3>
                  <div className="bookings-list rejected-list">
                    {studentBookings
                      .filter((b) => b.status === 'REJECTED')
                      .map((booking) => (
                        <div key={booking.id} className="booking-item rejected">
                          <div className="booking-info">
                            <h4>{booking.resource?.name}</h4>
                            <p className="booking-dates">
                              {formatDateTime(booking.startTime)} to {formatDateTime(booking.endTime)}
                            </p>
                            {booking.approvalReason && (
                              <p className="booking-reason">Reason: {booking.approvalReason}</p>
                            )}
                          </div>
                          <span className="status-badge rejected">Rejected</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedResource && (
        <BookingModal
          resource={selectedResource}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedResource(null);
          }}
          onSubmit={handleBooking}
        />
      )}

      <style>{`
        .browse-section {
          padding: 2rem 1.5rem;
          background: #f9f9f9;
        }

        .browse-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 2rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .search-filter-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          flex: 1;
          min-width: 400px;
        }

        .search-input,
        .filter-select {
          padding: 0.75rem 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 0.95rem;
          background: white;
        }

        .search-input {
          flex: 1;
          min-width: 250px;
        }

        .search-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: #0066cc;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .resources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .resource-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .resource-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          transform: translateY(-4px);
        }

        .resource-image-placeholder {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          height: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .resource-icon {
          font-size: 3.5rem;
          opacity: 0.9;
        }

        .resource-status {
          position: absolute;
          top: 1rem;
          right: 1rem;
        }

        .status-badge {
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          background: rgba(255, 255, 255, 0.9);
          color: #333;
        }

        .resource-content {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex: 1;
        }

        .resource-name {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
        }

        .resource-meta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .meta-item {
          display: flex;
          gap: 0.5rem;
        }

        .meta-item .label {
          font-weight: 600;
          color: #666;
          min-width: 70px;
        }

        .meta-item .value {
          color: #333;
        }

        .resource-description {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .book-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: auto;
        }

        .book-button:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .book-button:active {
          transform: scale(0.98);
        }

        .my-bookings-section {
          padding: 2rem 1.5rem;
        }

        .bookings-tabs {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .bookings-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .group-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid transparent;
        }

        .group-title.pending {
          color: #ff9f43;
          border-bottom-color: #ff9f43;
        }

        .group-title.approved {
          color: #2ed573;
          border-bottom-color: #2ed573;
        }

        .group-title.rejected {
          color: #ff5e78;
          border-bottom-color: #ff5e78;
        }

        .bookings-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        .booking-item {
          background: white;
          border-left: 4px solid;
          border-radius: 8px;
          padding: 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .booking-item.pending {
          border-left-color: #ff9f43;
          background: #fffbf0;
        }

        .booking-item.approved {
          border-left-color: #2ed573;
          background: #f0fdf4;
        }

        .booking-item.rejected {
          border-left-color: #ff5e78;
          background: #fef2f2;
        }

        .booking-info {
          flex: 1;
        }

        .booking-item h4 {
          margin: 0 0 0.5rem;
          font-size: 1rem;
          color: #333;
        }

        .booking-dates {
          margin: 0.25rem 0;
          font-size: 0.85rem;
          color: #666;
        }

        .booking-purpose {
          margin: 0.5rem 0 0;
          font-size: 0.85rem;
          color: #666;
          font-style: italic;
        }

        .booking-reason {
          margin: 0.5rem 0 0;
          font-size: 0.85rem;
          color: #c41e3a;
          font-style: italic;
        }

        .section-title {
          margin: 0;
        }

        .status-banner {
          padding: 1rem 1.5rem;
          border-radius: 8px;
          margin: 1rem 1.5rem 0;
          font-weight: 500;
        }

        .status-banner.error {
          background-color: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .status-banner.success {
          background-color: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .muted {
          color: #999;
          text-align: center;
          padding: 2rem;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .browse-header {
            flex-direction: column;
          }

          .search-filter-row {
            flex-direction: column;
            min-width: 100%;
          }

          .resources-grid {
            grid-template-columns: 1fr;
          }

          .bookings-list {
            grid-template-columns: 1fr;
          }

          .booking-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .booking-item .status-badge {
            margin-top: 1rem;
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
