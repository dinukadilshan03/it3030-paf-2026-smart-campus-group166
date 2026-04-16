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
}

export function CreateBookingForm({ onSuccess, onError, onSubmit }: CreateBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceSearch, setResourceSearch] = useState("");
  const [formData, setFormData] = useState({
    resourceId: 0,
    bookingDate: "",
    startTime: "",
    endTime: "",
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

  // Filter resources based on search
  const filteredResources = resources.filter(
    (r) =>
      r.name.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      r.resourceCode.toLowerCase().includes(resourceSearch.toLowerCase())
  );

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
                <p className="no-results">No resources found matching "{resourceSearch}"</p>
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
          />
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
          padding: 2rem;
          background: white;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
          max-width: 600px;
        }

        .form-section h2 {
          margin: 0 0 1.5rem;
          font-size: 1.5rem;
          color: #333;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .form-row .form-group {
          margin-bottom: 0;
        }

        .form-group label {
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
        }

        .required {
          color: #dc3545;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          padding: 0.75rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 0.95rem;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
        .form-group textarea:focus {
          outline: none;
          border-color: #0066cc;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .form-group textarea {
          resize: vertical;
        }

        .form-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 2rem;
        }

        .primary-button {
          padding: 0.75rem 1.5rem;
          background-color: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .primary-button:hover:not(:disabled) {
          background-color: #0052a3;
        }

        .primary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .search-input {
          margin-bottom: 0.5rem;
        }

        .form-group select {
          cursor: pointer;
          appearance: auto;
        }

        .form-group .loading-text {
          color: #666;
          font-style: italic;
          padding: 1rem;
          background: #f9f9f9;
          border-radius: 4px;
          margin: 0;
        }

        .form-group .no-results {
          color: #dc3545;
          font-size: 0.9rem;
          margin: 0.5rem 0 0;
          padding: 0.5rem;
          background: #fff5f5;
          border-radius: 4px;
        }
      `}</style>
    </form>
  );
}
