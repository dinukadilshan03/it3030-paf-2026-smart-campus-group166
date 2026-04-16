"use client";

import { useState } from "react";

import { TicketAttachmentDraftCard } from "@/components/tickets/TicketAttachmentDraftCard";
import {
  canCurrentUserManageAttachments,
  formatDateTime,
  formatFileSize,
  getTicketAttachmentContentUrl,
  getTicketAttachmentFormatLabel,
  TicketApiError,
} from "@/lib/tickets/shared";
import { validateAttachmentDraft } from "@/lib/tickets/validation";
import type {
  TicketAttachment,
  TicketAttachmentDraft,
  TicketAttachmentUpload,
  TicketDetail,
} from "@/lib/tickets/types";
import type { CurrentUser } from "@/types/auth";

type TicketAttachmentPanelProps = {
  currentUser: CurrentUser;
  ticket: TicketDetail;
  attachments: TicketAttachment[];
  busy?: boolean;
  onCreate: (payload: TicketAttachmentUpload) => Promise<void>;
  onDelete: (attachmentId: number) => Promise<void>;
};

async function toAttachmentDraft(file: File): Promise<TicketAttachmentDraft> {
  const previewUrl = await new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

  return {
    id: crypto.randomUUID(),
    file,
    previewUrl,
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
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
  const [draft, setDraft] = useState<TicketAttachmentDraft | null>(null);
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
            Evidence images
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Uploaded attachments
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Attach clear images of the issue so students, staff, and admins can follow the ticket
            without leaving the workflow.
          </p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => setFormOpen((current) => !current)}
            disabled={attachments.length >= 3}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {formOpen ? "Hide uploader" : "Add image"}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">
          {attachments.length}/3 uploaded
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

            if (!draft) {
              setErrors({ file: "Choose an image to upload." });
              return;
            }

            const validationErrors = validateAttachmentDraft(draft);
            if (Object.keys(validationErrors).length > 0) {
              setErrors(validationErrors);
              return;
            }

            try {
              setErrors({});
              await onCreate({
                file: draft.file as File,
              });
              setDraft(null);
              setFormOpen(false);
            } catch (error) {
              if (error instanceof TicketApiError) {
                setErrors(error.validationErrors);
              }
              setFormError(error instanceof Error ? error.message : "Attachment upload failed.");
            }
          }}
        >
          {!draft ? (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.25rem] border border-dashed border-slate-300 bg-white px-5 py-8 text-center transition hover:border-teal-300 hover:bg-teal-50/40">
              <span className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                Choose image
              </span>
              <span className="text-sm leading-7 text-slate-600">
                JPG, PNG, WEBP, or GIF up to 5 MB
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={busy || attachments.length >= 3}
                onChange={async (event) => {
                  const file = event.target.files?.[0] ?? null;
                  event.target.value = "";
                  if (!file) {
                    return;
                  }

                  setDraft(await toAttachmentDraft(file));
                  setErrors({});
                }}
              />
            </label>
          ) : (
            <>
              <div className="flex justify-end">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                  Replace image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={busy}
                    onChange={async (event) => {
                      const file = event.target.files?.[0] ?? null;
                      event.target.value = "";
                      if (!file) {
                        return;
                      }

                      setDraft(await toAttachmentDraft(file));
                      setErrors({});
                    }}
                  />
                </label>
              </div>

              <TicketAttachmentDraftCard
                draft={draft}
                errors={errors}
                onRemove={() => {
                  setDraft(null);
                  setErrors({});
                }}
              />
            </>
          )}

          {formError ? (
            <p className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy || attachments.length >= 3 || !draft}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Uploading image..." : "Upload image"}
          </button>
        </form>
      ) : null}

      <div className="mt-6">
        {attachments.length === 0 ? (
          <div className="rounded-[1.2rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm leading-7 text-slate-600">
            No evidence images uploaded for this ticket yet.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {attachments.map((attachment) => {
              const contentUrl = getTicketAttachmentContentUrl(ticket.id, attachment.id);

              return (
                <article
                  key={attachment.id}
                  className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-slate-50/75"
                >
                  <a href={contentUrl} target="_blank" rel="noreferrer" className="block bg-slate-100">
                    <img
                      src={contentUrl}
                      alt={attachment.title}
                      className="aspect-[16/10] w-full object-cover"
                    />
                  </a>

                  <div className="space-y-4 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-950">{attachment.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{attachment.fileName}</p>
                        <p className="mt-2 text-sm text-slate-600">
                          Uploaded by {attachment.uploadedByDisplayName} /{" "}
                          {formatDateTime(attachment.createdAt)}
                        </p>
                      </div>

                      {canManage ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            if (!window.confirm("Delete this uploaded image?")) {
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

                    <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white px-3 py-3">
                        <p className="font-semibold text-slate-900">Format</p>
                        <p className="mt-1">
                          {getTicketAttachmentFormatLabel(
                            attachment.mimeType,
                            attachment.fileName,
                          )}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-3 py-3">
                        <p className="font-semibold text-slate-900">Size</p>
                        <p className="mt-1">{formatFileSize(attachment.fileSize)}</p>
                      </div>
                      <div className="rounded-2xl bg-white px-3 py-3">
                        <p className="font-semibold text-slate-900">Open</p>
                        <a
                          href={contentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex text-sm font-semibold text-teal-700 transition hover:text-teal-800"
                        >
                          View full image
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
