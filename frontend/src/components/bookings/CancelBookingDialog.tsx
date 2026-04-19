"use client";

import { useState } from "react";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

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
  const [showErrorModal, setShowErrorModal] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      await onConfirm(reason);
      setReason("");
      onCancel();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      setError(errorMsg);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ErrorAlert
        isOpen={showErrorModal}
        message={error}
        onClose={() => setShowErrorModal(false)}
      />
      <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Cancel Booking</h2>

        <p className="modal-message">
          Are you sure you want to cancel the booking for <strong>{resourceName}</strong>? This
          action cannot be undone.
        </p>

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
          background-color: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-content {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(91, 76, 243, 0.02) 100%);
          border-radius: 1rem;
          padding: 2.5rem;
          max-width: 550px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(91, 76, 243, 0.15);
          backdrop-filter: blur(10px);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-content h2 {
          margin: 0 0 1rem;
          font-size: 1.5625rem;
          font-weight: 700;
          background: linear-gradient(135deg, #ff6b35 0%, #ff8455 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }

        .modal-message {
          margin: 0 0 1.75rem;
          color: #475569;
          line-height: 1.6;
          font-size: 0.9375rem;
          font-weight: 500;
        }

        .status-banner {
          padding: 1rem 1.25rem;
          border-radius: 0.625rem;
          margin-bottom: 1.5rem;
          font-size: 0.9375rem;
          font-weight: 600;
          border-left: 4px solid;
        }

        .status-banner.error {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.05) 100%);
          color: #7f1d1d;
          border-left-color: #ef4444;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.75rem;
        }

        .field label {
          font-weight: 700;
          color: #334155;
          font-size: 0.9375rem;
          text-transform: uppercase;
          letter-spacing: 0.25px;
        }

        .optional {
          font-weight: 500;
          color: #94a3b8;
          font-style: italic;
        }

        .field textarea {
          padding: 0.875rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.625rem;
          font-size: 0.9375rem;
          font-family: inherit;
          resize: vertical;
          background: rgba(255, 255, 255, 0.9);
          color: #1e293b;
          transition: all 0.2s ease;
        }

        .field textarea:hover {
          border-color: rgba(255, 107, 53, 0.3);
          background: rgba(255, 255, 255, 0.95);
        }

        .field textarea:focus {
          outline: none;
          border-color: #ff6b35;
          background: white;
          box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.12);
        }

        .field textarea:disabled {
          background-color: #f1f5f9;
          cursor: not-allowed;
          color: #94a3b8;
        }

        .button-row {
          display: flex;
          gap: 0.875rem;
          justify-content: flex-end;
        }

        button {
          padding: 0.875rem 2rem;
          border: none;
          border-radius: 0.625rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9375rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          letter-spacing: 0.25px;
        }

        .danger-button {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .danger-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
        }

        .secondary-button {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
          color: white;
        }

        .secondary-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(71, 85, 105, 0.3);
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
    </>
  );
}
