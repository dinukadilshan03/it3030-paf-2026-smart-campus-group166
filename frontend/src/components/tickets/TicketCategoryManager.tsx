"use client";

import { useState } from "react";

import { TicketDialog } from "@/components/tickets/TicketDialog";
import {
  TicketConfirmDialog,
  TicketPopupNotice,
  type TicketPopupNoticeState,
  buildTicketValidationNotice,
} from "@/components/tickets/TicketPopupDialogs";
import { TicketApiError } from "@/lib/tickets/shared";
import { validateTicketCategoryForm } from "@/lib/tickets/validation";
import type {
  TicketCategoryDetail,
  TicketCategoryFormValues,
  TicketCategorySummary,
} from "@/lib/tickets/types";

type TicketCategoryManagerProps = {
  open: boolean;
  busy?: boolean;
  categories: TicketCategorySummary[];
  onClose: () => void;
  onCreate: (payload: {
    code: string;
    name: string;
    description?: string;
    isActive?: boolean;
  }) => Promise<TicketCategoryDetail>;
  onUpdate: (
    id: number,
    payload: {
      code?: string;
      name?: string;
      description?: string;
      isActive?: boolean;
    },
  ) => Promise<TicketCategoryDetail>;
  onDelete: (id: number) => Promise<void>;
};

function toFormValues(category?: TicketCategorySummary | null): TicketCategoryFormValues {
  if (!category) {
    return {
      code: "",
      name: "",
      description: "",
      isActive: true,
    };
  }

  return {
    code: category.code,
    name: category.name,
    description: category.description ?? "",
    isActive: category.isActive,
  };
}

export function TicketCategoryManager({
  open,
  busy = false,
  categories,
  onClose,
  onCreate,
  onUpdate,
}: TicketCategoryManagerProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    categories[0]?.id ?? null,
  );
  const [createMode, setCreateMode] = useState(categories.length === 0);
  const [values, setValues] = useState<TicketCategoryFormValues>(toFormValues(categories[0]));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<TicketPopupNoticeState>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<{
    code: string;
    name: string;
    description?: string;
    isActive?: boolean;
  } | null>(null);

  const selectedCategory =
    selectedCategoryId == null
      ? null
      : categories.find((category) => category.id === selectedCategoryId) ?? null;

  const inputClassName =
    "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white";

  return (
    <TicketDialog
      open={open}
      onClose={onClose}
      title="Manage ticket categories"
      description="Admins can create, activate, retire, or rename incident categories. Use the active toggle to retire old categories without removing reporting history."
      widthClassName="max-w-6xl"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.25fr)]">
        <section className="space-y-4 rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Existing categories</p>
              <p className="text-sm text-slate-600">{categories.length} category record(s)</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCreateMode(true);
                setSelectedCategoryId(null);
                setValues(toFormValues());
                setErrors({});
                setFormError(null);
              }}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              New category
            </button>
          </div>

          <div className="space-y-3">
            {categories.length === 0 ? (
              <div className="rounded-[1.15rem] border border-dashed border-slate-300 bg-white px-4 py-6 text-sm leading-7 text-slate-600">
                No ticket categories exist yet.
              </div>
            ) : null}

            {categories.map((category) => {
              const selected = !createMode && selectedCategoryId === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setCreateMode(false);
                    setSelectedCategoryId(category.id);
                    setValues(toFormValues(category));
                    setErrors({});
                    setFormError(null);
                  }}
                  className={`w-full rounded-[1.2rem] border px-4 py-4 text-left transition ${
                    selected
                      ? "border-teal-400 bg-white shadow-[0_16px_35px_rgba(15,118,110,0.12)]"
                      : "border-slate-200 bg-white/80 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{category.name}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {category.code}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                        category.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {category.description || "No description added yet."}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[1.4rem] border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {createMode ? "Create category" : "Edit category"}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Keep codes short and stable so they are easy to reference across reports and audits.
              </p>
            </div>
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setFormError(null);

              const validationErrors = validateTicketCategoryForm(values);
              if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                setNotice(
                  buildTicketValidationNotice(
                    createMode ? "Category details need attention" : "Category changes need attention",
                    validationErrors,
                  ),
                );
                return;
              }

              try {
                setErrors({});
                const payload = {
                  code: values.code.trim().toUpperCase(),
                  name: values.name.trim(),
                  description: values.description.trim() || undefined,
                  isActive: values.isActive,
                };

                if (createMode) {
                  const createdCategory = await onCreate(payload);
                  setCreateMode(false);
                  setSelectedCategoryId(createdCategory.id);
                  setValues(toFormValues(createdCategory));
                } else if (selectedCategory) {
                  setPendingPayload(payload);
                  setConfirmOpen(true);
                }
              } catch (error) {
                if (error instanceof TicketApiError) {
                  setErrors(error.validationErrors);
                  setNotice(
                    buildTicketValidationNotice(
                      createMode ? "Category details need attention" : "Category changes need attention",
                      error.validationErrors,
                      error.message || "Review the highlighted category fields and try again.",
                    ),
                  );
                }
                const nextFormError =
                  error instanceof Error ? error.message : "Category save failed.";
                setFormError(nextFormError);
                setNotice({
                  tone: "error",
                  title: "Category save failed",
                  message: nextFormError,
                });
              }
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Category code
                <input
                  value={values.code}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      code: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="PROJECTOR"
                />
                {errors.code ? <span className="text-xs text-rose-600">{errors.code}</span> : null}
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Category name
                <input
                  value={values.name}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="Projector issue"
                />
                {errors.name ? <span className="text-xs text-rose-600">{errors.name}</span> : null}
              </label>
            </div>

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
                className={`${inputClassName} min-h-32 resize-y`}
                placeholder="Describe what belongs in this category and when staff should use it."
              />
            </label>

            <label className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={values.isActive}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-500"
              />
              Category is active and available for new tickets
            </label>

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
                {busy ? "Saving..." : createMode ? "Create category" : "Save changes"}
              </button>
              {!createMode ? (
                <button
                  type="button"
                  onClick={() => {
                    setCreateMode(true);
                    setSelectedCategoryId(null);
                    setValues(toFormValues());
                    setErrors({});
                    setFormError(null);
                  }}
                  disabled={busy}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Switch to create
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
            </div>
          </form>
        </section>
      </div>

      <TicketPopupNotice
        notice={notice}
        onClose={() => setNotice(null)}
        actionLabel="Review"
      />
      <TicketConfirmDialog
        open={confirmOpen}
        title="Save category changes"
        message="Are you sure you want to save these ticket category updates?"
        confirmLabel="Save changes"
        cancelLabel="Keep editing"
        busy={busy}
        tone="neutral"
        onClose={() => {
          if (busy) {
            return;
          }

          setConfirmOpen(false);
          setPendingPayload(null);
        }}
        onConfirm={async () => {
          if (!pendingPayload || !selectedCategory) {
            setConfirmOpen(false);
            return;
          }

          try {
            const updatedCategory = await onUpdate(selectedCategory.id, pendingPayload);
            setSelectedCategoryId(updatedCategory.id);
            setValues(toFormValues(updatedCategory));
            setConfirmOpen(false);
            setPendingPayload(null);
          } catch (error) {
            if (error instanceof TicketApiError) {
              setErrors(error.validationErrors);
              setNotice(
                buildTicketValidationNotice(
                  "Category changes need attention",
                  error.validationErrors,
                  error.message || "Review the highlighted category fields and try again.",
                ),
              );
            }

            const nextFormError =
              error instanceof Error ? error.message : "Category save failed.";
            setFormError(nextFormError);
            setNotice({
              tone: "error",
              title: "Category save failed",
              message: nextFormError,
            });
          }
        }}
      />
    </TicketDialog>
  );
}
