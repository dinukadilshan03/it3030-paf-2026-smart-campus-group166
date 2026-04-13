import { useState } from 'react';
import type { Resource } from '../services/resourceService';

interface BookingModalProps {
  resource: Resource;
  onClose: () => void;
  onSubmit: (bookingData: {
    startTime: string;
    endTime: string;
    purpose?: string;
    expectedAttendees?: number;
  }) => void;
}

export default function BookingModal({ resource, onClose, onSubmit }: BookingModalProps) {
  const [step, setStep] = useState<'date' | 'details'>('date');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [purpose, setPurpose] = useState('');
  const [attendees, setAttendees] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleTimeChange = (timeType: 'start' | 'end', value: string) => {
    if (timeType === 'start') {
      setStartTime(value);
      // Auto-set end time to 1 hour later
      const [hours, minutes] = value.split(':');
      const nextHour = String(parseInt(hours) + 1).padStart(2, '0');
      setEndTime(`${nextHour}:${minutes}`);
    } else {
      setEndTime(value);
    }
  };

  const validateBooking = () => {
    if (!selectedDate || !startTime || !endTime) {
      setError('Please select date and time');
      return false;
    }

    if (startTime >= endTime) {
      setError('End time must be after start time');
      return false;
    }

    if (attendees < 1) {
      setError('At least 1 attendee required');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError('');

    if (!validateBooking()) return;

    setIsSubmitting(true);

    try {
      const startDateTime = `${selectedDate}T${startTime}:00`;
      const endDateTime = `${selectedDate}T${endTime}:00`;

      await onSubmit({
        startTime: startDateTime,
        endTime: endDateTime,
        purpose: purpose.trim() || undefined,
        expectedAttendees: attendees || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Book {resource.name}</h2>
            <p className="modal-subtitle">{resource.location}</p>
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step ${step === 'date' ? 'active' : 'completed'}`}>
            <div className="step-number">1</div>
            <span className="step-label">Date & Time</span>
          </div>
          <div className="step-line" />
          <div className={`step ${step === 'details' ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span className="step-label">Details</span>
          </div>
        </div>

        {/* Step 1: Date & Time Selection */}
        {step === 'date' && (
          <div className="modal-step">
            <div className="step-content">
              {/* Calendar */}
              <div className="form-group">
                <label className="form-label">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  min={today}
                  className="date-input"
                />
                <p className="form-hint">Select your booking date</p>
              </div>

              {/* Time Selection */}
              <div className="time-section">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => handleTimeChange('start', e.target.value)}
                    className="time-input"
                  />
                </div>

                <div className="time-arrow">→</div>

                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => handleTimeChange('end', e.target.value)}
                    className="time-input"
                  />
                </div>
              </div>

              {/* Duration Display */}
              <div className="duration-display">
                <span className="duration-label">Duration:</span>
                <span className="duration-value">
                  {(() => {
                    const [startH, startM] = startTime.split(':').map(Number);
                    const [endH, endM] = endTime.split(':').map(Number);
                    const durationMin = (endH - startH) * 60 + (endM - startM);
                    const hours = Math.floor(durationMin / 60);
                    const mins = durationMin % 60;
                    return `${hours}h ${mins}m`;
                  })()}
                </span>
              </div>

              {/* Resource Info */}
              <div className="resource-info-box">
                <h4>Resource Details</h4>
                <div className="info-grid">
                  {resource.type && (
                    <div className="info-item">
                      <span className="info-label">Type</span>
                      <span className="info-value">{resource.type}</span>
                    </div>
                  )}
                  {resource.capacity && (
                    <div className="info-item">
                      <span className="info-label">Capacity</span>
                      <span className="info-value">{resource.capacity} people</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              className="next-button"
              onClick={() => setStep('details')}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <div className="modal-step">
            <div className="step-content">
              {/* Summary */}
              <div className="booking-summary">
                <div className="summary-item">
                  <span className="summary-label">📅 Date:</span>
                  <span className="summary-value">
                    {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-LK', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">⏰ Time:</span>
                  <span className="summary-value">
                    {startTime} – {endTime}
                  </span>
                </div>
              </div>

              {/* Purpose */}
              <div className="form-group">
                <label className="form-label">Purpose</label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="What will you use this resource for? (optional)"
                  className="form-textarea"
                  rows={3}
                />
                <p className="form-hint">Help admins understand your booking needs</p>
              </div>

              {/* Attendees */}
              <div className="form-group">
                <label className="form-label">Expected Attendees</label>
                <div className="attendees-input">
                  <button
                    className="attendees-button"
                    onClick={() => setAttendees(Math.max(1, attendees - 1))}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={attendees}
                    onChange={(e) => setAttendees(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={resource.capacity || 100}
                    className="attendees-field"
                  />
                  <button
                    className="attendees-button"
                    onClick={() =>
                      setAttendees(Math.min(resource.capacity || 100, attendees + 1))
                    }
                  >
                    +
                  </button>
                </div>
                {resource.capacity && (
                  <p className="form-hint">
                    Maximum capacity: {resource.capacity} people
                  </p>
                )}
              </div>

              {/* Confirmation Message */}
              <div className="confirmation-box">
                <p className="confirmation-text">
                  ✅ Your booking will be sent for approval. You'll receive a notification within 24 hours.
                </p>
              </div>
            </div>

            <div className="button-group">
              <button
                className="back-button"
                onClick={() => setStep('date')}
                disabled={isSubmitting}
              >
                Back
              </button>
              <button
                className="submit-button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .booking-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
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

        .booking-modal-content {
          background: white;
          border-radius: 16px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            transform: translateY(40px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          padding: 2rem 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .modal-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }

        .modal-subtitle {
          margin: 0.5rem 0 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .close-button:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .modal-error {
          margin: 1rem 1.5rem 0;
          padding: 0.75rem 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #991b1b;
          font-size: 0.9rem;
        }

        .step-indicator {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem 1.5rem 0;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e5e7eb;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          transition: all 0.3s;
        }

        .step.active .step-number {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .step.completed .step-number {
          background: #d1fae5;
          color: #065f46;
        }

        .step-label {
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: 500;
        }

        .step.active .step-label {
          color: #667eea;
          font-weight: 600;
        }

        .step-line {
          flex: 1;
          height: 2px;
          background: #e5e7eb;
          margin-top: 20px;
        }

        .modal-step {
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .step-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.95rem;
        }

        .date-input,
        .time-input,
        .form-textarea,
        .attendees-field {
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.95rem;
          font-family: inherit;
          transition: all 0.2s;
        }

        .date-input:focus,
        .time-input:focus,
        .form-textarea:focus,
        .attendees-field:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-hint {
          margin: 0;
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .time-section {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
        }

        .time-section .form-group {
          flex: 1;
        }

        .time-arrow {
          color: #9ca3af;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .duration-display {
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-left: 4px solid #667eea;
        }

        .duration-label {
          color: #6b7280;
          font-weight: 500;
        }

        .duration-value {
          font-weight: 700;
          color: #667eea;
          font-size: 1.1rem;
        }

        .resource-info-box {
          padding: 1rem;
          background: #fef3c7;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
        }

        .resource-info-box h4 {
          margin: 0 0 0.75rem;
          font-size: 0.9rem;
          color: #92400e;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-label {
          font-size: 0.75rem;
          color: #b45309;
          font-weight: 600;
          text-transform: uppercase;
        }

        .info-value {
          color: #92400e;
          font-weight: 500;
        }

        .booking-summary {
          padding: 1rem;
          background: #f0f9ff;
          border-radius: 8px;
          border-left: 4px solid #0284c7;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          font-size: 0.95rem;
        }

        .summary-label {
          font-weight: 600;
          color: #0c4a6e;
        }

        .summary-value {
          color: #0284c7;
          font-weight: 500;
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .attendees-input {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          overflow: hidden;
        }

        .attendees-button {
          background: #f3f4f6;
          border: none;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 1.2rem;
          color: #667eea;
          transition: all 0.2s;
        }

        .attendees-button:hover {
          background: #e5e7eb;
        }

        .attendees-field {
          border: none;
          text-align: center;
          flex: 1;
          padding: 0.5rem;
          font-weight: 600;
        }

        .confirmation-box {
          padding: 1rem;
          background: #f0fdf4;
          border-radius: 8px;
          border-left: 4px solid #16a34a;
        }

        .confirmation-text {
          margin: 0;
          color: #15803d;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .next-button,
        .submit-button,
        .back-button {
          padding: 0.85rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
        }

        .next-button,
        .submit-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          width: 100%;
        }

        .next-button:hover,
        .submit-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .next-button:active,
        .submit-button:active {
          transform: translateY(0);
        }

        .button-group {
          display: flex;
          gap: 1rem;
        }

        .back-button {
          background: #e5e7eb;
          color: #1f2937;
          flex: 1;
        }

        .back-button:hover {
          background: #d1d5db;
        }

        .submit-button {
          flex: 1;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .booking-modal-content {
            width: 95%;
            height: 100%;
            max-height: none;
            border-radius: 12px 12px 0 0;
          }

          .modal-header {
            padding: 1.5rem 1rem;
          }

          .modal-step {
            padding: 1.5rem 1rem;
          }

          .time-section {
            flex-direction: column;
            align-items: stretch;
          }

          .time-arrow {
            margin: 0;
            text-align: center;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
