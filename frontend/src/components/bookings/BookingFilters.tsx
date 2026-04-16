"use client";

import type { BookingFilters, BookingStatus } from "@/lib/bookings/types";

interface BookingFiltersProps {
  filters: BookingFilters;
  onFiltersChange: (filters: BookingFilters) => void;
}

const STATUSES: BookingStatus[] = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

export function BookingFilters({ filters, onFiltersChange }: BookingFiltersProps) {
  const handleStatusChange = (status: BookingStatus | "") => {
    onFiltersChange({ ...filters, status });
  };

  const handleResourceIdChange = (resourceId: string) => {
    onFiltersChange({
      ...filters,
      resourceId: resourceId ? Number(resourceId) : "",
    });
  };

  const handleRequesterUserIdChange = (userId: string) => {
    onFiltersChange({
      ...filters,
      requesterUserId: userId ? Number(userId) : "",
    });
  };

  const handleBookingDateChange = (date: string) => {
    onFiltersChange({ ...filters, bookingDate: date || undefined });
  };

  const handleReset = () => {
    onFiltersChange({});
  };

  return (
    <div className="booking-filters">
      <div className="filter-group">
        <label htmlFor="status-filter">Status</label>
        <select
          id="status-filter"
          value={filters.status || ""}
          onChange={(e) => handleStatusChange(e.target.value as BookingStatus | "")}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="resource-filter">Resource ID</label>
        <input
          id="resource-filter"
          type="number"
          value={filters.resourceId || ""}
          onChange={(e) => handleResourceIdChange(e.target.value)}
          placeholder="Filter by resource"
        />
      </div>

      <div className="filter-group">
        <label htmlFor="requester-filter">Requester User ID</label>
        <input
          id="requester-filter"
          type="number"
          value={filters.requesterUserId || ""}
          onChange={(e) => handleRequesterUserIdChange(e.target.value)}
          placeholder="Filter by requester"
        />
      </div>

      <div className="filter-group">
        <label htmlFor="date-filter">Booking Date</label>
        <input
          id="date-filter"
          type="date"
          value={filters.bookingDate || ""}
          onChange={(e) => handleBookingDateChange(e.target.value)}
        />
      </div>

      <div className="filter-actions">
        <button className="secondary-button" onClick={handleReset}>
          Reset Filters
        </button>
      </div>

      <style jsx>{`
        .booking-filters {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
          margin-bottom: 1.5rem;
          align-items: end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #333;
        }

        .filter-group input,
        .filter-group select {
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .filter-group input:focus,
        .filter-group select:focus {
          outline: none;
          border-color: #0066cc;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .filter-actions {
          display: flex;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
}
