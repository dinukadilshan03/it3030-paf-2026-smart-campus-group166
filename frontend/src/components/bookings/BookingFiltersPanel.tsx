"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { BookingFilters } from "@/lib/bookings/types";
import type { Resource } from "@/lib/resources/types";
import styles from "./BookingFiltersPanel.module.css";

interface BookingFiltersPanelProps {
  resources: Resource[];
  onFiltersChange: (filters: BookingFilters) => void;
  isLoading?: boolean;
}

export function BookingFiltersPanel({
  resources,
  onFiltersChange,
  isLoading = false,
}: BookingFiltersPanelProps) {
  const [resourceId, setResourceId] = useState<number | "">("");

  useEffect(() => {
    const filters: BookingFilters = {};
    if (resourceId) filters.resourceId = resourceId;

    onFiltersChange(filters);
  }, [resourceId, onFiltersChange]);

  const clearFilters = () => {
    setResourceId("");
  };

  const hasActiveFilters = resourceId !== "";

  return (
    <div className={styles.bookingFiltersPanel}>
      <div className={styles.filtersHeader}>
        <div className={styles.filterField}>
          <label htmlFor="filter-resource">Filter by Resource</label>
          <select
            id="filter-resource"
            value={resourceId}
            onChange={(e) => setResourceId(e.target.value ? Number(e.target.value) : "")}
            disabled={isLoading}
          >
            <option value="">All resources</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name} ({resource.resourceCode})
              </option>
            ))}
          </select>
        </div>
        {hasActiveFilters && (
          <button
            className={styles.linkButton}
            onClick={clearFilters}
            disabled={isLoading}
            title="Clear filter"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
