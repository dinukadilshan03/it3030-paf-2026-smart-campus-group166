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
          gap: 1.25rem;
          padding: 1.75rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(91, 76, 243, 0.02) 100%);
          border-radius: 0.875rem;
          border: 1px solid rgba(91, 76, 243, 0.15);
          margin-bottom: 1.75rem;
          align-items: end;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(10px);
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .filter-group label {
          font-size: 0.875rem;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.25px;
        }

        .filter-group input,
        .filter-group select {
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.625rem;
          font-size: 0.875rem;
          background: rgba(255, 255, 255, 0.9);
          color: #1e293b;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .filter-group input:hover,
        .filter-group select:hover {
          border-color: rgba(91, 76, 243, 0.3);
          background: rgba(255, 255, 255, 0.95);
        }

        .filter-group input:focus,
        .filter-group select:focus {
          outline: none;
          border-color: #5b4cf3;
          background: white;
          box-shadow: 0 0 0 4px rgba(91, 76, 243, 0.12);
        }

        .filter-actions {
          display: flex;
          gap: 0.875rem;
          align-items: end;
        }

        .secondary-button {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
          color: white;
          border: none;
          border-radius: 0.625rem;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          letter-spacing: 0.25px;
        }

        .secondary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(71, 85, 105, 0.3);
        }

        .secondary-button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
