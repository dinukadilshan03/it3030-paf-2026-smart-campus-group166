"use client";

import { useState } from "react";

import { TicketAttachmentDraftCard } from "@/components/tickets/TicketAttachmentDraftCard";
import { TicketDialog } from "@/components/tickets/TicketDialog";
import {
  TicketPopupNotice,
  type TicketPopupNoticeState,
  buildTicketValidationNotice,
} from "@/components/tickets/TicketPopupDialogs";
import { refineTicketDescriptionClient } from "@/lib/tickets/client";
import {
  getActiveTicketCategories,
  getLocationLabel,
  getResourceLabel,
  getTicketErrorMessage,
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
import type { AdminUserSummary } from "@/lib/users/types";
import type { RoleCode } from "@/types/auth";

type CreateTicketFormProps = {
  open: boolean;
  busy?: boolean;
  currentRole: RoleCode;
  categories: TicketCategorySummary[];
  locations: TicketLocationOption[];
  resources: TicketResourceOption[];
  reporterUsers: AdminUserSummary[];
  onClose: () => void;
  onSubmit: (submission: CreateTicketSubmission) => Promise<void>;
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

function getInitialValues(): CreateTicketFormValues {
  return {
    reporterUserId: "",
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
  currentRole,
  categories,
  locations,
  resources,
  reporterUsers,
  onClose,
  onSubmit,
}: CreateTicketFormProps) {
  const [values, setValues] = useState<CreateTicketFormValues>(getInitialValues());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isRefiningDescription, setIsRefiningDescription] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [refineMessage, setRefineMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<TicketPopupNoticeState>(null);

  const activeCategories = getActiveTicketCategories(categories);
  const canAddImages = currentRole === "STUDENT";
  const filteredResources = values.locationId
    ? resources.filter((resource) => resource.locationId === Number(values.locationId))
    : resources;

  const inputClassName =
    "w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white";

  return (
    <TicketDialog
      open={open}
      onClose={onClose}
      title="Report a new issue"
      description={
        canAddImages
          ? "Create a maintenance or incident ticket against a resource or a location, then attach up to 3 evidence images."
          : "Create a maintenance or incident ticket against a resource or a location. Evidence images can only be added by student reporters."
      }
    >
      <form
        className="space-y-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setFormError(null);

          const validationErrors = validateCreateTicketForm(values, resources, {
            requireReporterSelection: currentRole === "ADMIN",
          });
          if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setNotice(
              buildTicketValidationNotice(
                "Ticket details need attention",
                validationErrors,
              ),
            );
            return;
          }

          try {
            setErrors({});

            const submission: CreateTicketSubmission = {
              request: {
                reporterUserId:
                  currentRole === "ADMIN" ? toIdNumber(values.reporterUserId) : undefined,
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
              attachments: canAddImages
                ? values.attachments
                    .filter((attachment) => attachment.file)
                    .map((attachment) => ({
                      file: attachment.file as File,
                    }))
                : [],
            };

            await onSubmit(submission);
            onClose();
          } catch (error) {
            if (error instanceof TicketApiError) {
              setErrors(error.validationErrors);
              setNotice(
                buildTicketValidationNotice(
                  "Ticket details need attention",
                  error.validationErrors,
                  error.message || "Review the highlighted ticket fields and try again.",
                ),
              );
            }
            const nextFormError =
              error instanceof Error ? error.message : "Ticket creation failed.";
            setFormError(nextFormError);
            setNotice({
              tone: "error",
              title: "Ticket could not be created",
              message: nextFormError,
            });
          }
        }}
      >
        {currentRole === "ADMIN" ? (
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Reported by
            <select
              value={values.reporterUserId}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  reporterUserId: event.target.value,
                }))
              }
              className={inputClassName}
            >
              <option value="">Choose the reporter</option>
              {reporterUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName} / {user.role ?? "USER"} / {user.email}
                </option>
              ))}
            </select>
            {errors.reporterUserId ? (
              <span className="text-xs text-rose-600">{errors.reporterUserId}</span>
            ) : null}
          </label>
        ) : null}

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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>Description</span>
              <button
                type="button"
                disabled={busy || isRefiningDescription}
                onClick={async () => {
                  const nextDescription = values.description.trim();
                  if (!nextDescription) {
                    const nextError =
                      "Type your issue first, then use AI to polish the description.";
                    setRefineError(nextError);
                    setRefineMessage(null);
                    setNotice({
                      tone: "error",
                      title: "Description needed",
                      message: nextError,
                    });
                    return;
                  }

                  setRefineError(null);
                  setRefineMessage(null);
                  setIsRefiningDescription(true);
                  try {
                    const response = await refineTicketDescriptionClient({
                      title: values.title.trim() || undefined,
                      description: nextDescription,
                    });

                    setValues((current) => ({
                      ...current,
                      description: response.improvedDescription,
                    }));
                    setRefineMessage(
                      response.assistantEnabled
                        ? "AI polished the description. You can still edit it before submitting."
                        : "A clearer description was prepared. You can still edit it before submitting.",
                    );
                  } catch (error) {
                    const nextError = getTicketErrorMessage(
                      error,
                      "Could not polish the description right now.",
                    );
                    setRefineError(nextError);
                    setNotice({
                      tone: "error",
                      title: "AI polish failed",
                      message: nextError,
                    });
                  } finally {
                    setIsRefiningDescription(false);
                  }
                }}
                className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-800 transition hover:border-sky-300 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRefiningDescription ? "AI refining..." : "AI polish"}
              </button>
            </div>
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
            {refineMessage ? (
              <span className="text-xs text-emerald-700">{refineMessage}</span>
            ) : null}
            {refineError ? <span className="text-xs text-rose-600">{refineError}</span> : null}
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

          <div className="mt-5 grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
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

        {canAddImages ? (
          <section className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Evidence images</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Add up to three images that show the issue clearly. Format and file details are
                  filled in automatically.
                </p>
              </div>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                {values.attachments.length}/3 selected
              </span>
            </div>

            {errors.attachments ? (
              <p className="mt-3 text-xs text-rose-600">{errors.attachments}</p>
            ) : null}

            <div className="mt-5 space-y-5">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.25rem] border border-dashed border-slate-300 bg-white px-5 py-8 text-center transition hover:border-teal-300 hover:bg-teal-50/40">
                <span className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                  Choose images
                </span>
                <span className="text-sm leading-7 text-slate-600">
                  JPG, PNG, WEBP, or GIF up to 5 MB each
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  disabled={busy || values.attachments.length >= 3}
                  onChange={async (event) => {
                    const files = Array.from(event.target.files ?? []);
                    event.target.value = "";

                    if (files.length === 0) {
                      return;
                    }

                    const availableSlots = Math.max(0, 3 - values.attachments.length);
                    const nextFiles = files.slice(0, availableSlots);
                    const nextDrafts = await Promise.all(nextFiles.map((file) => toAttachmentDraft(file)));

                    setValues((current) => ({
                      ...current,
                      attachments: [...current.attachments, ...nextDrafts],
                    }));

                    setErrors((current) => {
                      const nextErrors = { ...current };
                      if (files.length > availableSlots) {
                        nextErrors.attachments = "Only up to 3 image attachments are allowed.";
                        setNotice({
                          tone: "error",
                          title: "Too many images",
                          message: "Only up to 3 image attachments are allowed.",
                        });
                      } else {
                        delete nextErrors.attachments;
                      }
                      return nextErrors;
                    });
                  }}
                />
              </label>

              {values.attachments.length === 0 ? (
                <div className="rounded-[1.2rem] border border-dashed border-slate-300 bg-white px-4 py-5 text-sm leading-7 text-slate-600">
                  No evidence images added yet.
                </div>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-2">
                {values.attachments.map((attachment, index) => {
                  const attachmentErrors: Record<string, string> = {};
                  Object.entries(errors).forEach(([key, message]) => {
                    const prefix = `attachments.${index}.`;
                    if (key.startsWith(prefix)) {
                      attachmentErrors[key.slice(prefix.length)] = message;
                    }
                  });

                  return (
                    <TicketAttachmentDraftCard
                      key={attachment.id}
                      draft={attachment}
                      errors={attachmentErrors}
                      onRemove={() =>
                        setValues((current) => ({
                          ...current,
                          attachments: current.attachments.filter(
                            (currentAttachment) => currentAttachment.id !== attachment.id,
                          ),
                        }))
                      }
                    />
                  );
                })}
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-5">
            <p className="text-sm font-semibold text-slate-900">Evidence images</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Only student reporters can upload issue images. This ticket will be created without
              image attachments.
            </p>
          </section>
        )}

        {formError ? (
          <p className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
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

      <TicketPopupNotice
        notice={notice}
        onClose={() => setNotice(null)}
        actionLabel="Review"
      />
    </TicketDialog>
  );
}
