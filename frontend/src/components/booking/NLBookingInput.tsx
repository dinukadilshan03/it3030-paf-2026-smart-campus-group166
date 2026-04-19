"use client";

import React, { useRef, useState } from "react";
import { frontendRouteFetch } from "@/lib/api/client";

type Confidence = "high" | "medium" | "low";
type ResourceResolution = "resolved" | "unresolved";

interface ParsedBooking {
  resourceQuery: string;
  resourceName: string;
  resourceId: string;
  resourceResolution: ResourceResolution;
  matchScore: number | null;
  matchedBy: string | null;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  purpose: string;
}

interface ParseBookingResponse {
  confidence: Confidence;
  parsed: ParsedBooking | null;
  clarification: string | null;
  summary: string;
}

interface NLBookingInputProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onSubmit?: () => void;
}

const SUGGESTION_CHIPS = [
  "Book Lab 3 tomorrow at 2pm for 2 hours",
  "Reserve Seminar Room 1 next Monday 10am to 12pm",
  "Library Study Room Friday afternoon",
];

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

export default function NLBookingInput({
  onSuccess,
  onError,
  onSubmit,
}: NLBookingInputProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [parseResult, setParseResult] = useState<ParseBookingResponse | null>(null);
  const [purpose, setPurpose] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showStatus = (message: string, type: "success" | "error") => {
    setStatusMessage(message);
    setStatusType(type);
    if (type === "error") {
      onError?.(message);
    } else {
      onSuccess?.(message);
    }
  };

  const parseBooking = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      showStatus("Please enter a booking request.", "error");
      return;
    }

    setLoading(true);
    setParseResult(null);
    setStatusMessage(null);
    setStatusType(null);

    try {
      const response = await frontendRouteFetch("/api/v1/ai/parse-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed }),
      });

      const data = (await response.json().catch(() => null)) as
        | (ParseBookingResponse & { error?: string; detail?: string })
        | null;

      if (!response.ok || !data) {
        const message =
          data?.detail || data?.error || `Request failed with status ${response.status}`;
        showStatus(message, "error");
        return;
      }

      setParseResult(data);
      setPurpose(data.parsed?.purpose || "");
      if (data.confidence !== "high" || data.parsed?.resourceResolution !== "resolved") {
        setStatusMessage(data.clarification || "Please refine the request before booking.");
        setStatusType("error");
      }
    } catch (error) {
      console.error("Booking parse error:", error);
      showStatus("Could not reach the server. Check your connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    await parseBooking(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    void parseBooking(suggestion);
  };

  const handleReset = () => {
    setParseResult(null);
    setPurpose("");
    setStatusMessage(null);
    setStatusType(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const canConfirm = Boolean(
    parseResult?.parsed &&
      parseResult.parsed.resourceResolution === "resolved" &&
      parseResult.parsed.resourceId &&
      parseResult.parsed.date &&
      parseResult.parsed.startTime &&
      parseResult.parsed.endTime &&
      parseResult.confidence === "high"
  );

  const submitBooking = async () => {
    if (!parseResult?.parsed || !canConfirm) {
      showStatus("Please refine the booking details before confirming.", "error");
      return;
    }

    const resourceId = Number.parseInt(parseResult.parsed.resourceId, 10);
    if (Number.isNaN(resourceId)) {
      showStatus("The selected resource could not be resolved. Please rephrase the request.", "error");
      return;
    }

    setConfirming(true);
    try {
      const response = await frontendRouteFetch("/api/v1/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId,
          bookingDate: parseResult.parsed.date,
          startTime: parseResult.parsed.startTime,
          endTime: parseResult.parsed.endTime,
          purpose: purpose.trim() || parseResult.parsed.purpose || "General booking",
          expectedAttendees: 1,
          requestNotes: "",
        }),
      });

      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(data?.message || `Failed with status ${response.status}`);
      }

      setInput("");
      setPurpose("");
      setParseResult(null);
      showStatus("Booking submitted! Awaiting admin approval.", "success");
      onSubmit?.();
    } catch (error) {
      console.error("Booking submit error:", error);
      showStatus(
        error instanceof Error ? error.message : "Failed to confirm booking",
        "error"
      );
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="nl-booking-card">
      <div className="header">
        <div>
          <h3>Book With AI</h3>
          <p>Describe the room, date, and time in one sentence and we will prepare the booking for you.</p>
        </div>
        <span className="badge">Best-match resource lookup</span>
      </div>

      {statusMessage && statusType && (
        <div className={`status status-${statusType}`}>{statusMessage}</div>
      )}

      {!parseResult && (
        <div className="composer">
          <form onSubmit={handleSubmit} className="composer-form">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder='Describe your booking, for example "Book Lab 3 tomorrow at 2pm for 2 hours"'
              disabled={loading}
              rows={3}
            />
            <button type="submit" className="primary-button" disabled={loading || !input.trim()}>
              {loading ? "Understanding..." : "Parse Request"}
            </button>
          </form>

          {!loading && !input && (
            <div className="suggestions">
              {SUGGESTION_CHIPS.map((chip) => (
                <button key={chip} type="button" className="chip" onClick={() => handleSuggestionClick(chip)}>
                  {chip}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {parseResult?.parsed && (
        <div className="preview">
          <div className="preview-header">
            <div>
              <h4>Booking Preview</h4>
              <p>{parseResult.summary}</p>
            </div>
            <span
              className={`resolution ${
                parseResult.parsed.resourceResolution === "resolved" ? "resolved" : "unresolved"
              }`}
            >
              {parseResult.parsed.resourceResolution === "resolved" ? "Ready to review" : "Needs refinement"}
            </span>
          </div>

          <div className="details-grid">
            <div>
              <span className="label">Matched Resource</span>
              <span className="value">
                {parseResult.parsed.resourceName || "Not resolved"}
              </span>
            </div>
            <div>
              <span className="label">Your Resource Text</span>
              <span className="value">{parseResult.parsed.resourceQuery || "Not provided"}</span>
            </div>
            <div>
              <span className="label">Date</span>
              <span className="value">
                {parseResult.parsed.date ? formatDate(parseResult.parsed.date) : "Missing"}
              </span>
            </div>
            <div>
              <span className="label">Time</span>
              <span className="value">
                {parseResult.parsed.startTime
                  ? `${formatTime(parseResult.parsed.startTime)} - ${formatTime(parseResult.parsed.endTime)}`
                  : "Missing"}
              </span>
            </div>
          </div>

          {parseResult.parsed.matchScore != null && parseResult.parsed.resourceResolution === "resolved" && (
            <p className="match-note">
              Matched automatically using{" "}
              <strong>{parseResult.parsed.matchedBy ?? "resource lookup"}</strong>
              {" "}with confidence {Math.round(parseResult.parsed.matchScore * 100)}%.
            </p>
          )}

          <label className="purpose-field">
            Purpose
            <textarea
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              placeholder="What is this booking for?"
              rows={2}
            />
          </label>

          {parseResult.clarification && !canConfirm && (
            <p className="clarification">{parseResult.clarification}</p>
          )}

          <div className="actions">
            <button
              type="button"
              className="primary-button"
              onClick={submitBooking}
              disabled={!canConfirm || confirming}
            >
              {confirming ? "Submitting..." : "Confirm Booking"}
            </button>
            <button type="button" className="secondary-button" onClick={handleReset} disabled={confirming}>
              Edit Request
            </button>
          </div>

          {!canConfirm && (
            <p className="hint">
              A booking can only be submitted after the resource, date, and time are all resolved.
            </p>
          )}
        </div>
      )}

      <style jsx>{`
        .nl-booking-card {
          border: 1px solid #dbe2ea;
          border-radius: 1rem;
          padding: 1.5rem;
          background: linear-gradient(180deg, #ffffff 0%, #f7fafc 100%);
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .header {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: flex-start;
        }

        .header h3 {
          margin: 0;
          font-size: 1.2rem;
          color: #102a43;
        }

        .header p {
          margin: 0.35rem 0 0;
          color: #486581;
          font-size: 0.95rem;
        }

        .badge {
          background: #e0f2fe;
          color: #075985;
          border-radius: 999px;
          padding: 0.35rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .status {
          padding: 0.9rem 1rem;
          border-radius: 0.8rem;
          font-size: 0.92rem;
        }

        .status-success {
          background: #ecfdf3;
          border: 1px solid #a7f3d0;
          color: #166534;
        }

        .status-error {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #9a3412;
        }

        .composer {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .composer-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        textarea {
          width: 100%;
          padding: 0.9rem 1rem;
          border: 1px solid #cbd5e1;
          border-radius: 0.85rem;
          font: inherit;
          resize: vertical;
          color: #102a43;
          background: #ffffff;
        }

        textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
        }

        .chip {
          border: 1px solid #dbe2ea;
          background: #f8fafc;
          color: #334e68;
          border-radius: 999px;
          padding: 0.45rem 0.8rem;
          cursor: pointer;
          font-size: 0.82rem;
        }

        .chip:hover {
          background: #eff6ff;
          border-color: #93c5fd;
        }

        .preview {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: flex-start;
        }

        .preview-header h4 {
          margin: 0;
          font-size: 1rem;
          color: #102a43;
        }

        .preview-header p {
          margin: 0.3rem 0 0;
          color: #486581;
          font-size: 0.9rem;
        }

        .resolution {
          border-radius: 999px;
          padding: 0.35rem 0.7rem;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .resolution.resolved {
          background: #ecfdf3;
          color: #166534;
        }

        .resolution.unresolved {
          background: #fff7ed;
          color: #9a3412;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.9rem;
        }

        .details-grid > div {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 0.85rem;
          padding: 0.85rem 0.95rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #829ab1;
        }

        .value {
          color: #102a43;
          font-size: 0.95rem;
          font-weight: 600;
        }

        .match-note,
        .clarification,
        .hint {
          margin: 0;
          font-size: 0.88rem;
        }

        .match-note {
          color: #486581;
        }

        .clarification {
          color: #9a3412;
        }

        .hint {
          color: #7c2d12;
        }

        .purpose-field {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          color: #334e68;
          font-size: 0.9rem;
          font-weight: 700;
        }

        .actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .primary-button,
        .secondary-button {
          border: none;
          border-radius: 0.8rem;
          padding: 0.8rem 1rem;
          font-size: 0.92rem;
          font-weight: 700;
          cursor: pointer;
        }

        .primary-button {
          background: #2563eb;
          color: #ffffff;
          flex: 1;
        }

        .primary-button:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .secondary-button {
          background: #e2e8f0;
          color: #334155;
        }

        @media (max-width: 768px) {
          .header,
          .preview-header {
            flex-direction: column;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
