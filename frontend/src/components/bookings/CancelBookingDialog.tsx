"use client";

import { useState } from "react";

interface CancelBookingDialogProps {
  isOpen: boolean;
  bookingId: number;
  resourceName: string;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
}

export function CancelBookingDialog({
  isOpen,
  bookingId,
  resourceName,
  onConfirm,
  onCancel,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      await onConfirm(reason);
      setReason("");
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Cancel Booking</h2>

        <p className="modal-message">
          Are you sure you want to cancel the booking for <strong>{resourceName}</strong>? This
          action cannot be undone.
        </p>

        {error && <div className="status-banner error">{error}</div>}

        <div className="field">
          <label>
            Cancellation Reason <span className="optional">(optional)</span>
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you cancelling this booking?"
            disabled={isSubmitting}
          />
        </div>

        <div className="button-row">
          <button className="danger-button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Cancelling..." : "Cancel Booking"}
          </button>
          <button className="secondary-button" onClick={onCancel} disabled={isSubmitting}>
            Keep Booking
          </button>
        </div>
      </div>

      <style jsx>{`
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
          border-radius: 4px;
          padding: 2rem;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-content h2 {
          margin: 0 0 1rem;
          font-size: 1.5rem;
          color: #333;
        }

        .modal-message {
          margin: 0 0 1.5rem;
          color: #666;
          line-height: 1.5;
        }

        .status-banner {
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          font-size: 0.95rem;
        }

        .status-banner.error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .field label {
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
        }

        .optional {
          font-weight: 400;
          color: #999;
          font-style: italic;
        }

        .field textarea {
          padding: 0.75rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 0.95rem;
          font-family: inherit;
          resize: vertical;
        }

        .field textarea:focus {
          outline: none;
          border-color: #0066cc;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .field textarea:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .button-row {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.95rem;
        }

        .danger-button {
          background-color: #dc3545;
          color: white;
        }

        .danger-button:hover:not(:disabled) {
          background-color: #c82333;
        }

        .secondary-button {
          background-color: #6c757d;
          color: white;
        }

        .secondary-button:hover:not(:disabled) {
          background-color: #5a6268;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
