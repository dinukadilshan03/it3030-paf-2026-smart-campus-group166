"use client";

interface ErrorAlertProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  autoDismissMs?: number;
}

export function ErrorAlert({
  isOpen,
  message,
  onClose,
  autoDismissMs = 0,
}: ErrorAlertProps) {
  if (!isOpen) return null;

  // Auto-dismiss if specified
  if (autoDismissMs > 0) {
    setTimeout(onClose, autoDismissMs);
  }

  return (
    <div className="error-modal-overlay" onClick={onClose}>
      <div
        className="error-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="error-header">
          <div className="error-icon">⚠️</div>
          <h3>Validation Error</h3>
        </div>

        <p className="error-message">{message}</p>

        <button onClick={onClose} className="close-button">
          Dismiss
        </button>
      </div>

      <style jsx>{`
        .error-modal-overlay {
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

        .error-modal-content {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.98) 0%,
            rgba(239, 68, 68, 0.02) 100%
          );
          border-radius: 1rem;
          padding: 2.5rem;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(239, 68, 68, 0.25);
          border: 2px solid rgba(239, 68, 68, 0.3);
          backdrop-filter: blur(10px);
          animation: slideUp 0.3s ease;
          text-align: center;
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

        .error-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .error-icon {
          font-size: 2rem;
          animation: shake 0.5s ease;
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        .error-header h3 {
          margin: 0;
          font-size: 1.375rem;
          font-weight: 700;
          color: #dc2626;
          letter-spacing: -0.5px;
        }

        .error-message {
          margin: 0 0 2rem;
          color: #7f1d1d;
          line-height: 1.6;
          font-size: 0.9375rem;
          font-weight: 500;
          word-break: break-word;
        }

        .close-button {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 0.625rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9375rem;
        }

        .close-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(220, 38, 38, 0.3);
        }

        .close-button:active {
          transform: translateY(0);
        }

        @media (max-width: 640px) {
          .error-modal-content {
            padding: 2rem;
            max-width: 95%;
          }

          .error-header h3 {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}
