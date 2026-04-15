"use client";

import type { TicketAttachmentDraft } from "@/lib/tickets/types";

type AttachmentMetadataFieldsProps = {
  value: TicketAttachmentDraft;
  errors?: Record<string, string>;
  onChange: (
    field: keyof Omit<TicketAttachmentDraft, "id">,
    nextValue: string,
  ) => void;
};

export function AttachmentMetadataFields({
  value,
  errors = {},
  onChange,
}: AttachmentMetadataFieldsProps) {
  const inputClassName =
    "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white";

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          File name
          <input
            value={value.fileName}
            onChange={(event) => onChange("fileName", event.target.value)}
            className={inputClassName}
            placeholder="projector-damage.jpg"
          />
          {errors.fileName ? <span className="text-xs text-rose-600">{errors.fileName}</span> : null}
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Attachment type
          <input
            value={value.attachmentType}
            onChange={(event) => onChange("attachmentType", event.target.value)}
            className={inputClassName}
            placeholder="evidence-image"
          />
          {errors.attachmentType ? (
            <span className="text-xs text-rose-600">{errors.attachmentType}</span>
          ) : null}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Storage bucket
          <input
            value={value.storageBucket}
            onChange={(event) => onChange("storageBucket", event.target.value)}
            className={inputClassName}
            placeholder="smart-campus-assets"
          />
          {errors.storageBucket ? (
            <span className="text-xs text-rose-600">{errors.storageBucket}</span>
          ) : null}
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Storage path
          <input
            value={value.storagePath}
            onChange={(event) => onChange("storagePath", event.target.value)}
            className={inputClassName}
            placeholder="tickets/TCK-2026-001/projector-damage.jpg"
          />
          {errors.storagePath ? (
            <span className="text-xs text-rose-600">{errors.storagePath}</span>
          ) : null}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          MIME type
          <input
            value={value.mimeType}
            onChange={(event) => onChange("mimeType", event.target.value)}
            className={inputClassName}
            placeholder="image/jpeg"
          />
          {errors.mimeType ? <span className="text-xs text-rose-600">{errors.mimeType}</span> : null}
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          File size in bytes
          <input
            type="number"
            min="0"
            value={value.fileSize}
            onChange={(event) => onChange("fileSize", event.target.value)}
            className={inputClassName}
            placeholder="245760"
          />
          {errors.fileSize ? <span className="text-xs text-rose-600">{errors.fileSize}</span> : null}
        </label>
      </div>
    </div>
  );
}
