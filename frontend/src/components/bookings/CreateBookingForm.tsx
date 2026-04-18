"use client";

import { useEffect, useState } from "react";
import type { CreateBookingRequest } from "@/lib/bookings/types";
import { createBookingClient } from "@/lib/bookings/client";
import { getResources } from "@/lib/resources/api";

interface Resource {
  id: number;
  name: string;
  resourceCode: string;
  description?: string;
  capacity?: number;
}

interface CreateBookingFormProps {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  onSubmit?: () => void;
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  initialResourceId?: number;
}

export function CreateBookingForm({ 
  onSuccess, 
  onError, 
  onSubmit,
  initialDate,
  initialStartTime,
  initialEndTime,
  initialResourceId 
}: CreateBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceSearch, setResourceSearch] = useState("");
  const [formData, setFormData] = useState({
    resourceId: initialResourceId || 0,
    bookingDate: initialDate || "",
    startTime: initialStartTime || "",
    endTime: initialEndTime || "",
    purpose: "",
    expectedAttendees: undefined,
    requestNotes: "",
  });

  // Fetch resources on mount
  useEffect(() => {
    const fetchResources = async () => {
      setIsLoadingResources(true);
      try {
        const data = await getResources();
        setResources(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load resources:", err);
        setResources([]);
      } finally {
        setIsLoadingResources(false);
      }
    };

    fetchResources();
  }, []);

  // Update form data when initial values change (e.g., from calendar selection)
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      resourceId: initialResourceId || 0,
      bookingDate: initialDate || "",
      startTime: initialStartTime || "",
      endTime: initialEndTime || "",
    }));
  }, [initialDate, initialStartTime, initialEndTime, initialResourceId]);

  // Helper function to check if a date is in the past
  const isPastDate = (dateString: string): boolean => {
    const [year, month, day] = dateString.split("-").map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayString = (): string => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  };

  // Filter resources based on search
  const filteredResources = resources.filter(
    (r) =>
      r.name.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      r.resourceCode.toLowerCase().includes(resourceSearch.toLowerCase())
  );

  const selectedResource =
    resources.find((resource) => resource.id === formData.resourceId) ?? null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value ? Number(value) : 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.resourceId || !formData.bookingDate || !formData.startTime || !formData.endTime) {
        throw new Error("Please fill in all required fields");
      }

      // Validate booking date is not in the past
      if (isPastDate(formData.bookingDate)) {
        throw new Error("Cannot book for past dates. Please select a future date.");
      }

      if (
        selectedResource?.capacity != null &&
        formData.expectedAttendees != null &&
        formData.expectedAttendees > selectedResource.capacity
      ) {
        throw new Error(
          `Exceeded capacity for this resource. Maximum allowed is ${selectedResource.capacity} attendees.`
        );
      }

      // Prepare the request
      const request: CreateBookingRequest = {
        resourceId: formData.resourceId,
        bookingDate: formData.bookingDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        purpose: formData.purpose || undefined,
        expectedAttendees: formData.expectedAttendees || undefined,
        requestNotes: formData.requestNotes || undefined,
      };

      await createBookingClient(request);

      onSuccess?.(
        "Booking created successfully! The resource owner will review your request shortly."
      );

      // Reset form
      setFormData({
        resourceId: 0,
        bookingDate: "",
        startTime: "",
        endTime: "",
        purpose: "",
        expectedAttendees: undefined,
        requestNotes: "",
      });

      onSubmit?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create booking";
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-booking-form">
      <div className="form-section">
        <h2>Create New Booking Request</h2>

        <div className="form-group">
          <label htmlFor="resourceName">
            Select Resource <span className="required">*</span>
          </label>
          {isLoadingResources ? (
            <p className="loading-text">Loading available resources...</p>
          ) : (
            <>
              <input
                id="resourceSearch"
                type="text"
                placeholder="Search by resource name or code..."
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                className="search-input"
              />
              <select
                id="resourceName"
                name="resourceId"
                value={formData.resourceId || ""}
                onChange={handleChange}
                required
              >
                <option value="">-- Select a resource --</option>
                {filteredResources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} ({resource.resourceCode})
                    {resource.capacity ? ` - Capacity: ${resource.capacity}` : ""}
                  </option>
                ))}
              </select>
              {filteredResources.length === 0 && resourceSearch && (
                <p className="no-results">No resources found matching &quot;{resourceSearch}&quot;</p>
              )}
            </>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="bookingDate">
            Booking Date <span className="required">*</span>
          </label>
          <input
            id="bookingDate"
            type="date"
            name="bookingDate"
            value={formData.bookingDate}
            onChange={handleChange}
            min={getTodayString()}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startTime">
              Start Time <span className="required">*</span>
            </label>
            <input
              id="startTime"
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endTime">
              End Time <span className="required">*</span>
            </label>
            <input
              id="endTime"
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="expectedAttendees">Expected Attendees</label>
          <input
            id="expectedAttendees"
            type="number"
            name="expectedAttendees"
            value={formData.expectedAttendees || ""}
            onChange={handleChange}
            placeholder="Number of expected attendees"
            min="1"
            max={selectedResource?.capacity ?? undefined}
          />
          {selectedResource?.capacity != null && (
            <p className="capacity-hint">
              Maximum allowed for this resource: {selectedResource.capacity} attendees
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="purpose">Purpose</label>
          <input
            id="purpose"
            type="text"
            name="purpose"
            value={formData.purpose || ""}
            onChange={handleChange}
            placeholder="What is this booking for?"
          />
        </div>

        <div className="form-group">
          <label htmlFor="requestNotes">Notes</label>
          <textarea
            id="requestNotes"
            name="requestNotes"
            value={formData.requestNotes || ""}
            onChange={handleChange}
            placeholder="Any additional notes or requirements?"
            rows={4}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Booking"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .create-booking-form {
          padding: 2.5rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(91, 76, 243, 0.02) 100%);
          border-radius: 1rem;
          border: 1px solid rgba(91, 76, 243, 0.15);
          max-width: 700px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(10px);
        }

        .form-section h2 {
          margin: 0 0 2rem;
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(135deg, #5b4cf3 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
          margin-bottom: 1.75rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-bottom: 1.75rem;
        }

        .form-row .form-group {
          margin-bottom: 0;
        }

        .form-group label {
          font-weight: 700;
          color: #334155;
          font-size: 0.9375rem;
          text-transform: uppercase;
          letter-spacing: 0.25px;
        }

        .required {
          color: #ff6b35;
          font-weight: 700;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          padding: 0.875rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.625rem;
          font-size: 0.9375rem;
          font-family: inherit;
          background: rgba(255, 255, 255, 0.9);
          transition: all 0.2s ease;
          color: #1e293b;
        }

        .form-group input:hover,
        .form-group textarea:hover,
        .form-group select:hover {
          border-color: rgba(91, 76, 243, 0.3);
          background: rgba(255, 255, 255, 0.95);
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #5b4cf3;
          background: white;
          box-shadow: 0 0 0 4px rgba(91, 76, 243, 0.12);
        }

        .form-group textarea {
          resize: vertical;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2.5rem;
        }

        .primary-button {
          padding: 0.875rem 2rem;
          background: linear-gradient(135deg, #5b4cf3 0%, #7c63f8 100%);
          color: white;
          border: none;
          border-radius: 0.625rem;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(91, 76, 243, 0.3);
          letter-spacing: 0.25px;
          flex: 1;
        }

        .primary-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(91, 76, 243, 0.4);
        }

        .primary-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .primary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .search-input {
          margin-bottom: 0.75rem;
        }

        .form-group select {
          cursor: pointer;
          appearance: auto;
        }

        .form-group .loading-text {
          color: #64748b;
          font-style: italic;
          padding: 1.25rem;
          background: rgba(91, 76, 243, 0.08);
          border-radius: 0.625rem;
          margin: 0;
          border: 1px solid rgba(91, 76, 243, 0.15);
          font-weight: 500;
        }

        .form-group .no-results {
          color: #ff6b35;
          font-size: 0.875rem;
          margin: 0.5rem 0 0;
          padding: 0.75rem;
          background: rgba(255, 107, 53, 0.08);
          border-radius: 0.5rem;
          border-left: 3px solid #ff6b35;
          font-weight: 600;
        }

        .capacity-hint {
          margin: 0;
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 500;
        }
      `}</style>
    </form>
  );
}
