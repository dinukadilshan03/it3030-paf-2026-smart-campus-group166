"use client";

import { useState } from "react";

import { AttachmentMetadataFields } from "@/components/tickets/AttachmentMetadataFields";
import {
  canCurrentUserManageAttachments,
  formatDateTime,
  formatFileSize,
  TicketApiError,
} from "@/lib/tickets/shared";
import { validateAttachmentDraft } from "@/lib/tickets/validation";
import type {
  CreateTicketAttachmentRequest,
  TicketAttachment,
  TicketAttachmentDraft,
  TicketDetail,
} from "@/lib/tickets/types";
import type { CurrentUser } from "@/types/auth";

type TicketAttachmentPanelProps = {
  currentUser: CurrentUser;
  ticket: TicketDetail;
  attachments: TicketAttachment[];
  busy?: boolean;
  onCreate: (payload: CreateTicketAttachmentRequest) => Promise<void>;
  onDelete: (attachmentId: number) => Promise<void>;
};

function getEmptyDraft(): TicketAttachmentDraft {
  return {
    id: "attachment-panel",
    fileName: "",
    storageBucket: "",
    storagePath: "",
    mimeType: "",
    fileSize: "",
    attachmentType: "",
  };
}

export function TicketAttachmentPanel({
  currentUser,
  ticket,
  attachments,
  busy = false,
  onCreate,
  onDelete,
}: TicketAttachmentPanelProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<TicketAttachmentDraft>(getEmptyDraft());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const canManage =
    currentUser.role != null &&
    currentUser.id != null &&
    canCurrentUserManageAttachments(currentUser.role, currentUser.id, ticket);

  return (
    <section className="rounded-[1.5rem] border border-white/70 bg-white/85 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Evidence metadata
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Attachment references
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            This frontend stores only attachment metadata. Actual binary upload still belongs to
            your external storage workflow.
          </p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => setFormOpen((current) => !current)}
            disabled={attachments.length >= 3}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {formOpen ? "Hide form" : "Add metadata"}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">
          {attachments.length}/3 stored
        </span>
        {!canManage ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">
            Only the reporter or an admin can change attachments
          </span>
        ) : null}
      </div>

      {formOpen ? (
        <form
          className="mt-6 space-y-4 rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setFormError(null);

            const validationErrors = validateAttachmentDraft(draft);
            if (Object.keys(validationErrors).length > 0) {
              setErrors(validationErrors);
              return;
            }

            try {
              setErrors({});
              await onCreate({
                fileName: draft.fileName.trim(),
                storageBucket: draft.storageBucket.trim(),
                storagePath: draft.storagePath.trim(),
                mimeType: draft.mimeType.trim() || undefined,
                fileSize: Number(draft.fileSize),
                attachmentType: draft.attachmentType.trim() || undefined,
              });
              setDraft(getEmptyDraft());
              setFormOpen(false);
            } catch (error) {
              if (error instanceof TicketApiError) {
                setErrors(error.validationErrors);
              }
              setFormError(error instanceof Error ? error.message : "Attachment metadata failed.");
            }
          }}
        >
          <AttachmentMetadataFields
            value={draft}
            errors={errors}
            onChange={(field, nextValue) =>
              setDraft((current) => ({
                ...current,
                [field]: nextValue,
              }))
            }
          />

          {formError ? (
            <p className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy || attachments.length >= 3}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Saving metadata..." : "Save metadata"}
          </button>
        </form>
      ) : null}

      <div className="mt-6 space-y-4">
        {attachments.length === 0 ? (
          <div className="rounded-[1.2rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm leading-7 text-slate-600">
            No attachment metadata saved for this ticket yet.
          </div>
        ) : null}

        {attachments.map((attachment) => (
          <article
            key={attachment.id}
            className="rounded-[1.35rem] border border-slate-200 bg-slate-50/75 p-4"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">{attachment.fileName}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {attachment.attachmentType || "Generic attachment"} ·{" "}
                  {attachment.mimeType || "MIME type not specified"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Uploaded by {attachment.uploadedByDisplayName} · {formatDateTime(attachment.createdAt)}
                </p>
              </div>

              {canManage ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    if (!window.confirm("Delete this attachment metadata entry?")) {
                      return;
                    }
                    await onDelete(attachment.id);
                  }}
                  className="text-sm font-semibold text-rose-700 transition hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Delete
                </button>
              ) : null}
            </div>

            <dl className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-900">Storage bucket</dt>
                <dd>{attachment.storageBucket}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">File size</dt>
                <dd>{formatFileSize(attachment.fileSize)}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="font-semibold text-slate-900">Storage path</dt>
                <dd className="break-all">{attachment.storagePath}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
