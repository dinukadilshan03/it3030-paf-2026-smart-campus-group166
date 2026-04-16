"use client";

import { useState } from "react";

import {
  canCurrentUserAddInternalNote,
  canCurrentUserManageComment,
  formatDateTime,
  TicketApiError,
  toTicketTitleCase,
} from "@/lib/tickets/shared";
import { validateCommentForm } from "@/lib/tickets/validation";
import type {
  CreateTicketCommentRequest,
  TicketComment,
  TicketCommentFormValues,
  TicketDetail,
  UpdateTicketCommentRequest,
} from "@/lib/tickets/types";
import type { CurrentUser } from "@/types/auth";

const COMMENT_TONE: Record<TicketComment["commentType"], string> = {
  PUBLIC_REPLY: "border-teal-200 bg-teal-50/70",
  INTERNAL_NOTE: "border-amber-200 bg-amber-50/85",
  STATUS_NOTE: "border-slate-200 bg-slate-100/80",
};

type TicketCommentsProps = {
  currentUser: CurrentUser;
  ticket: TicketDetail;
  comments: TicketComment[];
  busy?: boolean;
  onSubmit: (payload: CreateTicketCommentRequest) => Promise<void>;
  onUpdate: (commentId: number, payload: UpdateTicketCommentRequest) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
};

function getInitialValues(): TicketCommentFormValues {
  return {
    body: "",
    commentType: "PUBLIC_REPLY",
  };
}

export function TicketComments({
  currentUser,
  ticket,
  comments,
  busy = false,
  onSubmit,
  onUpdate,
  onDelete,
}: TicketCommentsProps) {
  const [values, setValues] = useState<TicketCommentFormValues>(getInitialValues());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [editingError, setEditingError] = useState<string | null>(null);
  const [activeCommentActionId, setActiveCommentActionId] = useState<number | null>(null);
  const [commentActionError, setCommentActionError] = useState<{
    commentId: number;
    message: string;
  } | null>(null);

  const canUseInternalNotes =
    currentUser.role != null &&
    currentUser.id != null &&
    canCurrentUserAddInternalNote(currentUser.role, currentUser.id, ticket);

  return (
    <section className="rounded-[1.5rem] border border-white/70 bg-white/85 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Conversation
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Comments and operational notes
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Public replies are visible to the reporter and assigned staff. Internal notes stay
            inside the operational queue.
          </p>
        </div>
      </div>

      <form
        className="mt-6 space-y-4 rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setFormError(null);

          const validationErrors = validateCommentForm(values, currentUser.role ?? "STUDENT");
          if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
          }

          try {
            setErrors({});
            await onSubmit({
              body: values.body.trim(),
              commentType: values.commentType,
            });
            setValues(getInitialValues());
          } catch (error) {
            if (error instanceof TicketApiError) {
              setErrors(error.validationErrors);
            }
            setFormError(error instanceof Error ? error.message : "Comment could not be posted.");
          }
        }}
      >
        {canUseInternalNotes ? (
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Comment type
            <select
              value={values.commentType}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  commentType: event.target.value as TicketCommentFormValues["commentType"],
                }))
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
            >
              <option value="PUBLIC_REPLY">Public reply</option>
              <option value="INTERNAL_NOTE">Internal note</option>
            </select>
            {errors.commentType ? (
              <span className="text-xs text-rose-600">{errors.commentType}</span>
            ) : null}
          </label>
        ) : null}

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Message
          <textarea
            rows={4}
            value={values.body}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                body: event.target.value,
              }))
            }
            className="min-h-28 resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
            placeholder={
              values.commentType === "INTERNAL_NOTE"
                ? "Capture operational context, staff findings, or internal coordination notes."
                : "Share an update, ask for clarification, or confirm what happened."
            }
          />
          {errors.body ? <span className="text-xs text-rose-600">{errors.body}</span> : null}
        </label>

        {formError ? (
          <p className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy
            ? "Posting..."
            : values.commentType === "INTERNAL_NOTE"
              ? "Add internal note"
              : "Post reply"}
        </button>
      </form>

      <div className="mt-6 space-y-4">
        {comments.length === 0 ? (
          <div className="rounded-[1.2rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm leading-7 text-slate-600">
            No comments on this ticket yet.
          </div>
        ) : null}

        {comments.map((comment) => {
          const canManage =
            currentUser.role != null &&
            currentUser.id != null &&
            canCurrentUserManageComment(currentUser.role, currentUser.id, comment);
          const isEditing = editingCommentId === comment.id;
          const isProcessingAction = activeCommentActionId === comment.id;

          return (
            <article
              key={comment.id}
              className={`rounded-[1.35rem] border p-4 ${COMMENT_TONE[comment.commentType]}`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950">{comment.authorDisplayName}</p>
                    <span className="inline-flex rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                      {toTicketTitleCase(comment.commentType)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{formatDateTime(comment.createdAt)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {comment.parentCommentId ? (
                    <span className="text-xs font-medium text-slate-500">
                      Reply to comment #{comment.parentCommentId}
                    </span>
                  ) : null}

                  {canManage ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditingBody(comment.body);
                          setEditingError(null);
                          setCommentActionError(null);
                        }}
                        disabled={busy || isProcessingAction}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm("Delete this comment?")) {
                            return;
                          }

                          setActiveCommentActionId(comment.id);
                          setCommentActionError(null);
                          try {
                            await onDelete(comment.id);
                            if (editingCommentId === comment.id) {
                              setEditingCommentId(null);
                              setEditingBody("");
                              setEditingError(null);
                            }
                          } catch (error) {
                            setCommentActionError({
                              commentId: comment.id,
                              message:
                                error instanceof Error
                                  ? error.message
                                  : "Comment could not be deleted.",
                            });
                          } finally {
                            setActiveCommentActionId(null);
                          }
                        }}
                        disabled={busy || isProcessingAction}
                        className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isProcessingAction ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              {isEditing ? (
                <div className="mt-4 space-y-3">
                  <textarea
                    rows={4}
                    value={editingBody}
                    onChange={(event) => setEditingBody(event.target.value)}
                    className="min-h-28 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                  />

                  {editingError ? (
                    <p className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {editingError}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!editingBody.trim()) {
                          setEditingError("Comment text is required.");
                          return;
                        }

                        setActiveCommentActionId(comment.id);
                        setEditingError(null);
                        setCommentActionError(null);
                        try {
                          await onUpdate(comment.id, { body: editingBody.trim() });
                          setEditingCommentId(null);
                          setEditingBody("");
                        } catch (error) {
                          if (error instanceof TicketApiError) {
                            setEditingError(
                              error.validationErrors.body ?? error.message ?? "Comment update failed.",
                            );
                          } else {
                            setEditingError(
                              error instanceof Error ? error.message : "Comment update failed.",
                            );
                          }
                        } finally {
                          setActiveCommentActionId(null);
                        }
                      }}
                      disabled={busy || isProcessingAction}
                      className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isProcessingAction ? "Saving..." : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditingBody("");
                        setEditingError(null);
                      }}
                      disabled={busy || isProcessingAction}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {comment.body}
                </p>
              )}

              {commentActionError?.commentId === comment.id ? (
                <p className="mt-3 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {commentActionError.message}
                </p>
              ) : null}

              {comment.isEdited && comment.editedAt ? (
                <p className="mt-3 text-xs text-slate-500">
                  Edited {formatDateTime(comment.editedAt)}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
