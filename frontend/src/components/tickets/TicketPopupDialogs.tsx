"use client";

import { TicketDialog } from "@/components/tickets/TicketDialog";

export type TicketPopupTone = "success" | "error" | "info" | "warning";

export type TicketPopupNoticeState = {
  tone: TicketPopupTone;
  title?: string;
  message: string;
  details?: string[];
} | null;

type TicketPopupNoticeProps = {
  notice: TicketPopupNoticeState;
  onClose: () => void;
  actionLabel?: string;
};

type TicketConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  details?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  tone?: "danger" | "neutral";
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

const NOTICE_STYLE_MAP: Record<
  Exclude<TicketPopupTone, never>,
  {
    panel: string;
    badge: string;
    text: string;
    button: string;
    defaultTitle: string;
  }
> = {
  success: {
    panel: "border-emerald-200 bg-emerald-50/90",
    badge: "border-emerald-200 bg-white text-emerald-800",
    text: "text-emerald-950",
    button: "bg-emerald-600 text-white hover:bg-emerald-500",
    defaultTitle: "Success",
  },
  error: {
    panel: "border-rose-200 bg-rose-50/90",
    badge: "border-rose-200 bg-white text-rose-700",
    text: "text-rose-950",
    button: "bg-rose-600 text-white hover:bg-rose-500",
    defaultTitle: "Please review this",
  },
  info: {
    panel: "border-sky-200 bg-sky-50/90",
    badge: "border-sky-200 bg-white text-sky-800",
    text: "text-sky-950",
    button: "bg-sky-600 text-white hover:bg-sky-500",
    defaultTitle: "Information",
  },
  warning: {
    panel: "border-amber-200 bg-amber-50/95",
    badge: "border-amber-200 bg-white text-amber-800",
    text: "text-amber-950",
    button: "bg-amber-500 text-slate-950 hover:bg-amber-400",
    defaultTitle: "Please confirm",
  },
};

export function collectTicketValidationMessages(
  validationErrors: Record<string, string>,
) {
  return [...new Set(Object.values(validationErrors).map((value) => value.trim()).filter(Boolean))];
}

export function buildTicketValidationNotice(
  title: string,
  validationErrors: Record<string, string>,
  fallbackMessage = "Review the highlighted fields and try again.",
): TicketPopupNoticeState {
  const details = collectTicketValidationMessages(validationErrors);

  if (details.length === 0) {
    return {
      tone: "error",
      title,
      message: fallbackMessage,
    };
  }

  if (details.length === 1) {
    return {
      tone: "error",
      title,
      message: details[0],
    };
  }

  return {
    tone: "error",
    title,
    message: fallbackMessage,
    details,
  };
}

export function TicketPopupNotice({
  notice,
  onClose,
  actionLabel = "OK",
}: TicketPopupNoticeProps) {
  if (!notice) {
    return null;
  }

  const toneStyle = NOTICE_STYLE_MAP[notice.tone];

  return (
    <TicketDialog
      open
      onClose={onClose}
      title={notice.title ?? toneStyle.defaultTitle}
      widthClassName="max-w-lg"
    >
      <div className="space-y-5">
        <div className={`rounded-[1.35rem] border px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ${toneStyle.panel}`}>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${toneStyle.badge}`}
          >
            {notice.tone}
          </span>
          <p className={`mt-4 text-sm leading-7 ${toneStyle.text}`}>{notice.message}</p>

          {notice.details?.length ? (
            <div className="mt-4 rounded-[1.1rem] border border-white/80 bg-white/75 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Details
              </p>
              <div className="mt-3 space-y-2">
                {notice.details.map((detail) => (
                  <div key={detail} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${toneStyle.button}`}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </TicketDialog>
  );
}

export function TicketConfirmDialog({
  open,
  title,
  message,
  details,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busy = false,
  tone = "danger",
  onConfirm,
  onClose,
}: TicketConfirmDialogProps) {
  const confirmButtonClass =
    tone === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-500"
      : "bg-slate-950 text-white hover:bg-slate-800";

  return (
    <TicketDialog
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={title}
      widthClassName="max-w-lg"
    >
      <div className="space-y-5">
        <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/90 px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
            Confirmation
          </span>
          <p className="mt-4 text-sm leading-7 text-slate-700">{message}</p>

          {details?.length ? (
            <div className="mt-4 rounded-[1.1rem] border border-white/80 bg-white/80 px-4 py-4">
              <div className="space-y-2">
                {details.map((detail) => (
                  <div key={detail} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={busy}
            className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmButtonClass}`}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </TicketDialog>
  );
}
