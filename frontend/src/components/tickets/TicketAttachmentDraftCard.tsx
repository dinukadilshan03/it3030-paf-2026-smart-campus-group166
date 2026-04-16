"use client";

import { formatFileSize, getTicketAttachmentFormatLabel } from "@/lib/tickets/shared";
import type { TicketAttachmentDraft } from "@/lib/tickets/types";

type TicketAttachmentDraftCardProps = {
  draft: TicketAttachmentDraft;
  errors?: Record<string, string>;
  onRemove: () => void;
};

export function TicketAttachmentDraftCard({
  draft,
  errors = {},
  onRemove,
}: TicketAttachmentDraftCardProps) {
  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[16/10] bg-slate-100">
        {draft.previewUrl ? (
          <img
            src={draft.previewUrl}
            alt={draft.fileName || "Selected attachment preview"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
            Preview unavailable
          </div>
        )}

        <button
          type="button"
          onClick={onRemove}
          className="absolute right-3 top-3 inline-flex items-center justify-center rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-white"
        >
          Remove
        </button>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="font-semibold uppercase tracking-[0.14em] text-slate-500">File</p>
            <p className="mt-1 truncate text-sm font-medium text-slate-700">{draft.fileName}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="font-semibold uppercase tracking-[0.14em] text-slate-500">Format</p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {getTicketAttachmentFormatLabel(draft.mimeType || null, draft.fileName)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="font-semibold uppercase tracking-[0.14em] text-slate-500">Size</p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {formatFileSize(draft.fileSize)}
            </p>
          </div>
        </div>

        {errors.file ? <p className="text-xs text-rose-600">{errors.file}</p> : null}
      </div>
    </div>
  );
}
