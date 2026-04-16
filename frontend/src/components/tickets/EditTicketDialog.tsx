"use client";

import { useState } from "react";

import { TicketDialog } from "@/components/tickets/TicketDialog";
import {
  getActiveTicketCategories,
  getLocationLabel,
  getResourceLabel,
  TicketApiError,
  toIdNumber,
} from "@/lib/tickets/shared";
import { validateUpdateTicketForm } from "@/lib/tickets/validation";
import type {
  TicketCategorySummary,
  TicketDetail,
  TicketLocationOption,
  TicketPriority,
  TicketResourceOption,
  UpdateTicketRequest,
} from "@/lib/tickets/types";

type EditTicketDialogProps = {
  open: boolean;
  busy?: boolean;
  ticket: TicketDetail | null;
  categories: TicketCategorySummary[];
  locations: TicketLocationOption[];
  resources: TicketResourceOption[];
  onClose: () => void;
  onSubmit: (payload: UpdateTicketRequest) => Promise<void>;
};

type TicketEditFormValues = {
  reporterUserId: string;
  resourceId: string;
  locationId: string;
  ticketCategoryId: string;
  title: string;
  description: string;
  priority: TicketPriority;
  preferredContactName: string;
  preferredContactEmail: string;
  preferredContactPhone: string;
};

function getInitialValues(ticket: TicketDetail | null): TicketEditFormValues {
  return {
    reporterUserId: ticket?.reporterUserId ? String(ticket.reporterUserId) : "",
    resourceId: ticket?.resourceId ? String(ticket.resourceId) : "",
    locationId: ticket?.locationId ? String(ticket.locationId) : "",
    ticketCategoryId: ticket?.ticketCategoryId ? String(ticket.ticketCategoryId) : "",
    title: ticket?.title ?? "",
    description: ticket?.description ?? "",
    priority: ticket?.priority ?? "MEDIUM",
    preferredContactName: ticket?.preferredContactName ?? "",
    preferredContactEmail: ticket?.preferredContactEmail ?? "",
    preferredContactPhone: ticket?.preferredContactPhone ?? "",
  };
}

const PRIORITY_OPTIONS: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function EditTicketDialog({
  open,
  busy = false,
  ticket,
  categories,
  locations,
  resources,
  onClose,
  onSubmit,
}: EditTicketDialogProps) {
  const [values, setValues] = useState<TicketEditFormValues>(getInitialValues(ticket));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const activeCategories = getActiveTicketCategories(categories);
  const filteredResources = values.locationId
    ? resources.filter((resource) => resource.locationId === Number(values.locationId))
    : resources;
  const inputClassName =
    "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white";

  return (
    <TicketDialog
      open={open}
      onClose={onClose}
      title="Edit ticket details"
      description="Open tickets can be corrected by the reporter, and admins can adjust ticket details at any point in the workflow."
    >
      <form
        className="space-y-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setFormError(null);

          const validationErrors = validateUpdateTicketForm(values, resources);
          if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
          }

          try {
            setErrors({});
            await onSubmit({
              resourceId: toIdNumber(values.resourceId),
              locationId: toIdNumber(values.locationId),
              ticketCategoryId: Number(values.ticketCategoryId),
              title: values.title.trim(),
              description: values.description.trim(),
              priority: values.priority,
              preferredContactName: values.preferredContactName.trim() || undefined,
              preferredContactEmail: values.preferredContactEmail.trim() || undefined,
              preferredContactPhone: values.preferredContactPhone.trim() || undefined,
            });
            onClose();
          } catch (error) {
            if (error instanceof TicketApiError) {
              setErrors(error.validationErrors);
            }
            setFormError(error instanceof Error ? error.message : "Ticket update failed.");
          }
        }}
      >
        {ticket ? (
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
            <p className="font-semibold text-slate-900">{ticket.ticketNumber}</p>
            <p>{ticket.title}</p>
          </div>
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
              Keep the ticket tied to a specific room, area, or campus resource.
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
                      selectedResource &&
                      nextLocationId &&
                      selectedResource.locationId !== Number(nextLocationId)
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
            {busy ? "Saving changes..." : "Save changes"}
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
