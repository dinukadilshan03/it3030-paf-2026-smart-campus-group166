"use client";

import { useState } from "react";

import { AttachmentMetadataFields } from "@/components/tickets/AttachmentMetadataFields";
import { TicketDialog } from "@/components/tickets/TicketDialog";
import {
  getActiveTicketCategories,
  getLocationLabel,
  getResourceLabel,
  TicketApiError,
  toIdNumber,
} from "@/lib/tickets/shared";
import { validateCreateTicketForm } from "@/lib/tickets/validation";
import type {
  CreateTicketFormValues,
  CreateTicketSubmission,
  TicketAttachmentDraft,
  TicketCategorySummary,
  TicketLocationOption,
  TicketPriority,
  TicketResourceOption,
} from "@/lib/tickets/types";

type CreateTicketFormProps = {
  open: boolean;
  busy?: boolean;
  categories: TicketCategorySummary[];
  locations: TicketLocationOption[];
  resources: TicketResourceOption[];
  onClose: () => void;
  onSubmit: (submission: CreateTicketSubmission) => Promise<void>;
};

function createEmptyAttachmentDraft(): TicketAttachmentDraft {
  return {
    id: crypto.randomUUID(),
    fileName: "",
    storageBucket: "",
    storagePath: "",
    mimeType: "",
    fileSize: "",
    attachmentType: "",
  };
}

function getInitialValues(): CreateTicketFormValues {
  return {
    resourceId: "",
    locationId: "",
    ticketCategoryId: "",
    title: "",
    description: "",
    priority: "MEDIUM",
    preferredContactName: "",
    preferredContactEmail: "",
    preferredContactPhone: "",
    attachments: [],
  };
}

const PRIORITY_OPTIONS: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function CreateTicketForm({
  open,
  busy = false,
  categories,
  locations,
  resources,
  onClose,
  onSubmit,
}: CreateTicketFormProps) {
  const [values, setValues] = useState<CreateTicketFormValues>(getInitialValues());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const activeCategories = getActiveTicketCategories(categories);
  const filteredResources = values.locationId
    ? resources.filter((resource) => resource.locationId === Number(values.locationId))
    : resources;

  const inputClassName =
    "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white";

  const updateAttachment = (
    attachmentId: string,
    field: keyof Omit<TicketAttachmentDraft, "id">,
    nextValue: string,
  ) => {
    setValues((current) => ({
      ...current,
      attachments: current.attachments.map((attachment) =>
        attachment.id === attachmentId ? { ...attachment, [field]: nextValue } : attachment,
      ),
    }));
  };

  return (
    <TicketDialog
      open={open}
      onClose={onClose}
      title="Report a new issue"
      description="Create a maintenance or incident ticket against a resource or a location. Attachment support is metadata-only for now, so capture the storage details instead of uploading a file."
    >
      <form
        className="space-y-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setFormError(null);

          const validationErrors = validateCreateTicketForm(values, resources);
          if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
          }

          try {
            setErrors({});

            const submission: CreateTicketSubmission = {
              request: {
                resourceId: toIdNumber(values.resourceId),
                locationId: toIdNumber(values.locationId),
                ticketCategoryId: Number(values.ticketCategoryId),
                title: values.title.trim(),
                description: values.description.trim(),
                priority: values.priority,
                preferredContactName: values.preferredContactName.trim() || undefined,
                preferredContactEmail: values.preferredContactEmail.trim() || undefined,
                preferredContactPhone: values.preferredContactPhone.trim() || undefined,
              },
              attachments: values.attachments.map((attachment) => ({
                fileName: attachment.fileName.trim(),
                storageBucket: attachment.storageBucket.trim(),
                storagePath: attachment.storagePath.trim(),
                mimeType: attachment.mimeType.trim() || undefined,
                fileSize: Number(attachment.fileSize),
                attachmentType: attachment.attachmentType.trim() || undefined,
              })),
            };

            await onSubmit(submission);
            onClose();
          } catch (error) {
            if (error instanceof TicketApiError) {
              setErrors(error.validationErrors);
            }
            setFormError(error instanceof Error ? error.message : "Ticket creation failed.");
          }
        }}
      >
        <section className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Category
            <select
              value={values.ticketCategoryId}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  ticketCategoryId: event.target.value,
                }))
              }
              className={inputClassName}
            >
              <option value="">Choose a category</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.ticketCategoryId ? (
              <span className="text-xs text-rose-600">{errors.ticketCategoryId}</span>
            ) : null}
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Priority
            <select
              value={values.priority}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  priority: event.target.value as TicketPriority,
                }))
              }
              className={inputClassName}
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Title
            <input
              value={values.title}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              className={inputClassName}
              placeholder="Projector screen is flickering in Lab 3"
            />
            {errors.title ? <span className="text-xs text-rose-600">{errors.title}</span> : null}
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Description
            <textarea
              rows={5}
              value={values.description}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className={`${inputClassName} min-h-36 resize-y`}
              placeholder="Describe the fault, when it started, and any visible impact on classes or staff operations."
            />
            {errors.description ? (
              <span className="text-xs text-rose-600">{errors.description}</span>
            ) : null}
          </label>
        </section>

        <section className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">Incident scope</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Choose a location for area-level incidents, or pick a specific resource. When a
              resource is selected, its location is locked in automatically.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Location
              <select
                value={values.locationId}
                onChange={(event) => {
                  const nextLocationId = event.target.value;
                  const selectedResource =
                    values.resourceId.trim() === ""
                      ? null
                      : resources.find((resource) => resource.id === Number(values.resourceId));

                  setValues((current) => ({
                    ...current,
                    locationId: nextLocationId,
                    resourceId:
                      selectedResource && nextLocationId && selectedResource.locationId !== Number(nextLocationId)
                        ? ""
                        : current.resourceId,
                  }));
                }}
                className={inputClassName}
              >
                <option value="">Choose a location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {getLocationLabel(location)}
                  </option>
                ))}
              </select>
              {errors.locationId ? (
                <span className="text-xs text-rose-600">{errors.locationId}</span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Resource
              <select
                value={values.resourceId}
                onChange={(event) => {
                  const nextResourceId = event.target.value;
                  const selectedResource =
                    nextResourceId.trim() === ""
                      ? null
                      : resources.find((resource) => resource.id === Number(nextResourceId));

                  setValues((current) => ({
                    ...current,
                    resourceId: nextResourceId,
                    locationId: selectedResource ? String(selectedResource.locationId) : current.locationId,
                  }));
                }}
                className={inputClassName}
              >
                <option value="">No specific resource</option>
                {filteredResources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {getResourceLabel(resource)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Preferred contact name
            <input
              value={values.preferredContactName}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  preferredContactName: event.target.value,
                }))
              }
              className={inputClassName}
              placeholder="Optional"
            />
            {errors.preferredContactName ? (
              <span className="text-xs text-rose-600">{errors.preferredContactName}</span>
            ) : null}
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Preferred contact email
            <input
              value={values.preferredContactEmail}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  preferredContactEmail: event.target.value,
                }))
              }
              className={inputClassName}
              placeholder="Optional"
            />
            {errors.preferredContactEmail ? (
              <span className="text-xs text-rose-600">{errors.preferredContactEmail}</span>
            ) : null}
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Preferred contact phone
            <input
              value={values.preferredContactPhone}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  preferredContactPhone: event.target.value,
                }))
              }
              className={inputClassName}
              placeholder="Optional"
            />
            {errors.preferredContactPhone ? (
              <span className="text-xs text-rose-600">{errors.preferredContactPhone}</span>
            ) : null}
          </label>
        </section>

        <section className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Attachment metadata</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Add up to three storage references for evidence images. These details will be
                saved after the ticket is created.
              </p>
            </div>
            <button
              type="button"
              disabled={values.attachments.length >= 3}
              onClick={() =>
                setValues((current) => ({
                  ...current,
                  attachments: [...current.attachments, createEmptyAttachmentDraft()],
                }))
              }
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add metadata
            </button>
          </div>

          {errors.attachments ? (
            <p className="mt-3 text-xs text-rose-600">{errors.attachments}</p>
          ) : null}

          <div className="mt-5 space-y-4">
            {values.attachments.length === 0 ? (
              <div className="rounded-[1.2rem] border border-dashed border-slate-300 bg-white px-4 py-5 text-sm leading-7 text-slate-600">
                No attachment metadata added yet.
              </div>
            ) : null}

            {values.attachments.map((attachment, index) => {
              const attachmentErrors: Record<string, string> = {};
              Object.entries(errors).forEach(([key, message]) => {
                const prefix = `attachments.${index}.`;
                if (key.startsWith(prefix)) {
                  attachmentErrors[key.slice(prefix.length)] = message;
                }
              });

              return (
                <div
                  key={attachment.id}
                  className="rounded-[1.25rem] border border-slate-200 bg-white p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Attachment {index + 1}
                      </p>
                      <p className="text-xs text-slate-500">
                        Evidence reference stored outside the app
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setValues((current) => ({
                          ...current,
                          attachments: current.attachments.filter(
                            (currentAttachment) => currentAttachment.id !== attachment.id,
                          ),
                        }))
                      }
                      className="text-sm font-semibold text-rose-700 transition hover:text-rose-800"
                    >
                      Remove
                    </button>
                  </div>

                  <AttachmentMetadataFields
                    value={attachment}
                    errors={attachmentErrors}
                    onChange={(field, nextValue) => updateAttachment(attachment.id, field, nextValue)}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {formError ? (
          <p className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Creating ticket..." : "Create ticket"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>
    </TicketDialog>
  );
}
