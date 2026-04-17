"use client";

type TicketDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  widthClassName?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function TicketDialog({
  open,
  title,
  description,
  widthClassName = "max-w-3xl",
  onClose,
  children,
}: TicketDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClassName} overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Ticket workflow
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {title}
            </h2>
            {description ? (
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            aria-label="Close dialog"
          >
            x
          </button>
        </header>

        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-6 py-6 md:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
