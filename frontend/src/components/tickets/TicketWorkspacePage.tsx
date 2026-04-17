"use client";

import { useState } from "react";

import { AssignmentDialog } from "@/components/tickets/AssignmentDialog";
import { CreateTicketForm } from "@/components/tickets/CreateTicketForm";
import { EditTicketDialog } from "@/components/tickets/EditTicketDialog";
import { StatusUpdateDialog } from "@/components/tickets/StatusUpdateDialog";
import { TicketCategoryManager } from "@/components/tickets/TicketCategoryManager";
import { TicketDetailPanel } from "@/components/tickets/TicketDetailPanel";
import { TicketFilters } from "@/components/tickets/TicketFilters";
import { TicketList } from "@/components/tickets/TicketList";
import {
  createTicketAttachmentClient,
  createTicketCategoryClient,
  createTicketClient,
  createTicketCommentClient,
  deleteTicketClient,
  deleteTicketCommentClient,
  deleteTicketAttachmentClient,
  deleteTicketCategoryClient,
  getTicketBundleClient,
  listTicketCategoriesClient,
  listTicketsClient,
  updateTicketClient,
  updateTicketCommentClient,
  updateTicketAssignmentClient,
  updateTicketCategoryClient,
  updateTicketStatusClient,
} from "@/lib/tickets/client";
import {
  DEFAULT_TICKET_FILTERS,
  getAwaitingFirstResponseCount,
  getInProgressTicketCount,
  getOpenTicketCount,
  getResolvedTicketCount,
  getSlaRiskTicketCount,
  getTicketErrorMessage,
  getUnassignedTicketCount,
  resolveSelectedTicketId,
  TicketApiError,
} from "@/lib/tickets/shared";
import type {
  CreateTicketCommentRequest,
  CreateTicketSubmission,
  TicketBundle,
  TicketCategorySummary,
  TicketFilters as TicketFilterValues,
  TicketLocationOption,
  TicketResourceOption,
  TicketSummary,
  UpdateTicketCommentRequest,
} from "@/lib/tickets/types";
import type { CurrentUser } from "@/types/auth";
import type { AdminUserSummary } from "@/lib/users/types";

type TicketWorkspacePageProps = {
  currentUser: CurrentUser;
  initialTickets: TicketSummary[];
  initialCategories: TicketCategorySummary[];
  initialLocations: TicketLocationOption[];
  initialResources: TicketResourceOption[];
  initialStaffUsers: AdminUserSummary[];
  initialReporterUsers: AdminUserSummary[];
  initialSelectedBundle: TicketBundle | null;
};

type FeedbackState =
  | {
      tone: "success" | "error";
      message: string;
    }
  | null;

function getWorkspaceHeading(role: CurrentUser["role"]) {
  switch (role) {
    case "ADMIN":
      return "Admin ticket operations";
    case "STAFF":
      return "Assigned staff workbench";
    case "STUDENT":
      return "Student ticket tracker";
    default:
      return "Ticket workspace";
  }
}

function getWorkspaceDescription(role: CurrentUser["role"]) {
  switch (role) {
    case "ADMIN":
      return "Review every campus issue report, assign the right staff owner, reject invalid requests when needed, close resolved work, and keep categories clean for reporting.";
    case "STAFF":
      return "Work the tickets assigned to you, report new campus issues when you spot them, document progress with comments or internal notes, and capture a proper resolution summary before admin closure.";
    case "STUDENT":
      return "Report faults against a room, lab, or equipment item, then follow assignment, comments, and service-level timing directly inside the ticket workflow.";
    default:
      return "Manage the maintenance and incident workflow.";
  }
}

export function TicketWorkspacePage({
  currentUser,
  initialTickets,
  initialCategories,
  initialLocations,
  initialResources,
  initialStaffUsers,
  initialReporterUsers,
  initialSelectedBundle,
}: TicketWorkspacePageProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [categories, setCategories] = useState(initialCategories);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(
    initialSelectedBundle?.detail.id ?? initialTickets[0]?.id ?? null,
  );
  const [selectedBundle, setSelectedBundle] = useState<TicketBundle | null>(initialSelectedBundle);
  const [filters, setFilters] = useState<Required<TicketFilterValues>>({
    ...DEFAULT_TICKET_FILTERS,
  });
  const [draftFilters, setDraftFilters] = useState<Required<TicketFilterValues>>({
    ...DEFAULT_TICKET_FILTERS,
  });
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  async function syncWorkspace(nextFilters: Required<TicketFilterValues>, preferredTicketId: number | null) {
    const filtersToUse = { ...nextFilters };
    const nextTickets = await listTicketsClient(filtersToUse);
    const nextSelectedTicketId = resolveSelectedTicketId(nextTickets, preferredTicketId);
    const nextBundle =
      nextSelectedTicketId == null ? null : await getTicketBundleClient(nextSelectedTicketId);

    setTickets(nextTickets);
    setSelectedTicketId(nextSelectedTicketId);
    setSelectedBundle(nextBundle);
    setFilters(filtersToUse);
    setDraftFilters(filtersToUse);
  }

  async function refreshSelectedBundle(ticketId = selectedTicketId) {
    if (ticketId == null) {
      setSelectedBundle(null);
      return;
    }

    const nextBundle = await getTicketBundleClient(ticketId);
    setSelectedBundle(nextBundle);
  }

  async function refreshCategories() {
    const nextCategories = await listTicketCategoriesClient();
    setCategories(nextCategories);
    return nextCategories;
  }

  const openCount = getOpenTicketCount(tickets);
  const inProgressCount = getInProgressTicketCount(tickets);
  const resolvedCount = getResolvedTicketCount(tickets);
  const unassignedCount = getUnassignedTicketCount(tickets);
  const awaitingFirstResponseCount = getAwaitingFirstResponseCount(tickets);
  const slaRiskCount = getSlaRiskTicketCount(tickets);
  const focusMetricLabel =
    currentUser.role === "ADMIN"
      ? "Unassigned"
      : currentUser.role === "STAFF"
        ? "SLA at risk"
        : "Awaiting first response";
  const focusMetricValue =
    currentUser.role === "ADMIN"
      ? unassignedCount
      : currentUser.role === "STAFF"
        ? slaRiskCount
        : awaitingFirstResponseCount;

  return (
    <>
      <section className="space-y-6">
        <section className="rounded-[1.75rem] border border-white/70 bg-white/85 p-8 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Ticket workflow
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                {getWorkspaceHeading(currentUser.role)}
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">
                {getWorkspaceDescription(currentUser.role)}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {currentUser.role ? (
                <button
                  type="button"
                  onClick={() => setCreateDialogOpen(true)}
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Report issue
                </button>
              ) : null}
              {currentUser.role === "ADMIN" ? (
                <button
                  type="button"
                  onClick={() => setCategoryDialogOpen(true)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Manage categories
                </button>
              ) : null}
              <button
                type="button"
                disabled={isListLoading || isMutating}
                onClick={async () => {
                  setFeedback(null);
                  setIsListLoading(true);
                  try {
                    await syncWorkspace(filters, selectedTicketId);
                  } catch (error) {
                    setFeedback({
                      tone: "error",
                      message: getTicketErrorMessage(
                        error,
                        "Could not refresh the ticket queue.",
                      ),
                    });
                  } finally {
                    setIsListLoading(false);
                  }
                }}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Refresh queue
              </button>
            </div>
          </div>
        </section>

        {feedback ? (
          <p
            className={`rounded-[1.3rem] border px-4 py-3 text-sm ${
              feedback.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {feedback.message}
          </p>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-[1.4rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium text-slate-600">Tickets in scope</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{tickets.length}</p>
          </div>
          <div className="rounded-[1.4rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium text-slate-600">Open</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-sky-800">{openCount}</p>
          </div>
          <div className="rounded-[1.4rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium text-slate-600">In progress</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-amber-900">
              {inProgressCount}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium text-slate-600">Resolved</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-800">
              {resolvedCount}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium text-slate-600">{focusMetricLabel}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{focusMetricValue}</p>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
          <div className="space-y-6">
            <TicketFilters
              value={draftFilters}
              categories={categories}
              busy={isListLoading || isMutating}
              onChange={setDraftFilters}
              onApply={async () => {
                setFeedback(null);
                setIsListLoading(true);
                try {
                  await syncWorkspace(draftFilters, selectedTicketId);
                } catch (error) {
                  setFeedback({
                    tone: "error",
                    message: getTicketErrorMessage(error, "Could not apply ticket filters."),
                  });
                } finally {
                  setIsListLoading(false);
                }
              }}
              onReset={async () => {
                const nextFilters = { ...DEFAULT_TICKET_FILTERS };
                setDraftFilters(nextFilters);
                setFeedback(null);
                setIsListLoading(true);
                try {
                  await syncWorkspace(nextFilters, selectedTicketId);
                } catch (error) {
                  setFeedback({
                    tone: "error",
                    message: getTicketErrorMessage(error, "Could not reset the ticket filters."),
                  });
                } finally {
                  setIsListLoading(false);
                }
              }}
            />

            <TicketList
              role={currentUser.role ?? "STUDENT"}
              currentUserId={currentUser.id}
              tickets={tickets}
              selectedTicketId={selectedTicketId}
              busy={isListLoading}
              onSelect={async (ticketId) => {
                setFeedback(null);
                setSelectedTicketId(ticketId);
                setIsDetailLoading(true);
                try {
                  setSelectedBundle(await getTicketBundleClient(ticketId));
                } catch (error) {
                  setFeedback({
                    tone: "error",
                    message: getTicketErrorMessage(error, "Could not load the selected ticket."),
                  });
                } finally {
                  setIsDetailLoading(false);
                }
              }}
            />
          </div>

          <TicketDetailPanel
            currentUser={currentUser}
            ticketBundle={selectedBundle}
            detailLoading={isDetailLoading}
            busy={isMutating}
            onOpenEdit={() => setEditDialogOpen(true)}
            onOpenAssignment={() => setAssignmentDialogOpen(true)}
            onOpenStatus={() => setStatusDialogOpen(true)}
            onDeleteTicket={async () => {
              if (selectedTicketId == null) return;

              const deletedTicketNumber = selectedBundle?.detail.ticketNumber ?? `Ticket #${selectedTicketId}`;
              setFeedback(null);
              setIsMutating(true);
              try {
                await deleteTicketClient(selectedTicketId);
                await syncWorkspace(filters, null);
                setFeedback({
                  tone: "success",
                  message:
                    currentUser.role === "ADMIN"
                      ? `${deletedTicketNumber} deleted successfully.`
                      : `${deletedTicketNumber} withdrawn successfully.`,
                });
              } catch (error) {
                setFeedback({
                  tone: "error",
                  message: getTicketErrorMessage(error, "Could not remove the ticket."),
                });
              } finally {
                setIsMutating(false);
              }
            }}
            onCreateComment={async (payload: CreateTicketCommentRequest) => {
              if (selectedTicketId == null) return;

              setIsMutating(true);
              try {
                await createTicketCommentClient(selectedTicketId, payload);
                await refreshSelectedBundle(selectedTicketId);
                setFeedback({
                  tone: "success",
                  message:
                    payload.commentType === "INTERNAL_NOTE"
                      ? "Internal note added."
                      : "Ticket comment posted.",
                });
              } catch (error) {
                throw error;
              } finally {
                setIsMutating(false);
              }
            }}
            onUpdateComment={async (commentId: number, payload: UpdateTicketCommentRequest) => {
              if (selectedTicketId == null) return;

              setIsMutating(true);
              try {
                await updateTicketCommentClient(selectedTicketId, commentId, payload);
                await refreshSelectedBundle(selectedTicketId);
                setFeedback({
                  tone: "success",
                  message: "Comment updated.",
                });
              } catch (error) {
                throw error;
              } finally {
                setIsMutating(false);
              }
            }}
            onDeleteComment={async (commentId: number) => {
              if (selectedTicketId == null) return;

              setIsMutating(true);
              try {
                await deleteTicketCommentClient(selectedTicketId, commentId);
                await refreshSelectedBundle(selectedTicketId);
                setFeedback({
                  tone: "success",
                  message: "Comment deleted.",
                });
              } catch (error) {
                throw error;
              } finally {
                setIsMutating(false);
              }
            }}
            onCreateAttachment={async (payload) => {
              if (selectedTicketId == null) return;

              setIsMutating(true);
              try {
                await createTicketAttachmentClient(selectedTicketId, payload);
                await refreshSelectedBundle(selectedTicketId);
                setFeedback({
                  tone: "success",
                  message: "Attachment image uploaded.",
                });
              } catch (error) {
                throw error;
              } finally {
                setIsMutating(false);
              }
            }}
            onDeleteAttachment={async (attachmentId) => {
              if (selectedTicketId == null) return;

              setFeedback(null);
              setIsMutating(true);
              try {
                await deleteTicketAttachmentClient(selectedTicketId, attachmentId);
                await refreshSelectedBundle(selectedTicketId);
                setFeedback({
                  tone: "success",
                  message: "Attachment image deleted.",
                });
              } catch (error) {
                setFeedback({
                  tone: "error",
                  message: getTicketErrorMessage(
                    error,
                    "Could not delete the attachment image.",
                  ),
                });
              } finally {
                setIsMutating(false);
              }
            }}
          />
        </div>
      </section>

      {createDialogOpen ? (
        <CreateTicketForm
          key="create-ticket"
          open={createDialogOpen}
          busy={isMutating}
          currentRole={currentUser.role ?? "STUDENT"}
          categories={categories}
          locations={initialLocations}
          resources={initialResources}
          reporterUsers={initialReporterUsers}
          onClose={() => setCreateDialogOpen(false)}
          onSubmit={async (submission: CreateTicketSubmission) => {
            setFeedback(null);
            setIsMutating(true);

            let createdTicketNumber: string | null = null;
            let createdTicketId: number | null = null;

            try {
              const createdTicket = await createTicketClient(submission.request);
              createdTicketNumber = createdTicket.ticketNumber;
              createdTicketId = createdTicket.id;

              for (const attachment of submission.attachments) {
                await createTicketAttachmentClient(createdTicket.id, attachment);
              }

              const nextFilters = { ...DEFAULT_TICKET_FILTERS };
              await syncWorkspace(nextFilters, createdTicket.id);

              setFeedback({
                tone: "success",
                message:
                  submission.attachments.length > 0
                    ? `${createdTicket.ticketNumber} created with ${submission.attachments.length} image attachment(s).`
                    : `${createdTicket.ticketNumber} created successfully.`,
              });
              setCreateDialogOpen(false);
            } catch (error) {
              if (createdTicketId != null && createdTicketNumber) {
                try {
                  const nextFilters = { ...DEFAULT_TICKET_FILTERS };
                  await syncWorkspace(nextFilters, createdTicketId);
                } catch {
                  // Best effort refresh after partial success.
                }

                setCreateDialogOpen(false);
                setFeedback({
                  tone: "error",
                  message: `${createdTicketNumber} was created, but one or more images could not be uploaded: ${getTicketErrorMessage(error, "Unknown error.")}`,
                });
                return;
              }

              if (!(error instanceof TicketApiError && Object.keys(error.validationErrors).length > 0)) {
                setFeedback({
                  tone: "error",
                  message: getTicketErrorMessage(error, "Could not create the ticket."),
                });
              }

              throw error;
            } finally {
              setIsMutating(false);
            }
          }}
        />
      ) : null}

      {editDialogOpen ? (
        <EditTicketDialog
          key={`edit-${selectedBundle?.detail.id ?? "none"}-${selectedBundle?.detail.updatedAt ?? "none"}`}
          open={editDialogOpen}
          busy={isMutating}
          ticket={selectedBundle?.detail ?? null}
          categories={categories}
          locations={initialLocations}
          resources={initialResources}
          onClose={() => setEditDialogOpen(false)}
          onSubmit={async (payload) => {
            if (selectedTicketId == null) return;

            setFeedback(null);
            setIsMutating(true);
            try {
              await updateTicketClient(selectedTicketId, payload);
              await syncWorkspace(filters, selectedTicketId);
              setFeedback({
                tone: "success",
                message: "Ticket details updated.",
              });
            } catch (error) {
              throw error;
            } finally {
              setIsMutating(false);
            }
          }}
        />
      ) : null}

      {assignmentDialogOpen ? (
        <AssignmentDialog
          key={`assignment-${selectedBundle?.detail.id ?? "none"}`}
          open={assignmentDialogOpen}
          busy={isMutating}
          ticket={selectedBundle?.detail ?? null}
          staffUsers={initialStaffUsers}
          onClose={() => setAssignmentDialogOpen(false)}
          onSubmit={async (payload) => {
            if (selectedTicketId == null) return;

            setFeedback(null);
            setIsMutating(true);
            try {
              await updateTicketAssignmentClient(selectedTicketId, payload);
              await syncWorkspace(filters, selectedTicketId);
              setFeedback({
                tone: "success",
                message: "Ticket assignment saved.",
              });
            } catch (error) {
              throw error;
            } finally {
              setIsMutating(false);
            }
          }}
        />
      ) : null}

      {statusDialogOpen ? (
        <StatusUpdateDialog
          key={`status-${selectedBundle?.detail.id ?? "none"}-${selectedBundle?.detail.status ?? "none"}`}
          open={statusDialogOpen}
          busy={isMutating}
          role={currentUser.role ?? "STUDENT"}
          ticket={selectedBundle?.detail ?? null}
          onClose={() => setStatusDialogOpen(false)}
          onSubmit={async (payload) => {
            if (selectedTicketId == null) return;

            setFeedback(null);
            setIsMutating(true);
            try {
              await updateTicketStatusClient(selectedTicketId, payload);
              await syncWorkspace(filters, selectedTicketId);
              setFeedback({
                tone: "success",
                message: "Ticket status updated.",
              });
            } catch (error) {
              throw error;
            } finally {
              setIsMutating(false);
            }
          }}
        />
      ) : null}

      {categoryDialogOpen ? (
        <TicketCategoryManager
          key={`categories-${categories.map((category) => `${category.id}-${category.isActive}`).join("|")}`}
          open={categoryDialogOpen}
          busy={isMutating}
          categories={categories}
          onClose={() => setCategoryDialogOpen(false)}
          onCreate={async (payload) => {
            setFeedback(null);
            setIsMutating(true);
            try {
              const detail = await createTicketCategoryClient(payload);
              await refreshCategories();
              await syncWorkspace(filters, selectedTicketId);
              setFeedback({
                tone: "success",
                message: "Ticket category created.",
              });
              return detail;
            } finally {
              setIsMutating(false);
            }
          }}
          onUpdate={async (categoryId, payload) => {
            setFeedback(null);
            setIsMutating(true);
            try {
              const detail = await updateTicketCategoryClient(categoryId, payload);
              await refreshCategories();
              await syncWorkspace(filters, selectedTicketId);
              setFeedback({
                tone: "success",
                message: "Ticket category updated.",
              });
              return detail;
            } finally {
              setIsMutating(false);
            }
          }}
          onDelete={async (categoryId) => {
            setFeedback(null);
            setIsMutating(true);
            try {
              await deleteTicketCategoryClient(categoryId);
              const nextCategories = await refreshCategories();

              const nextFilters: Required<TicketFilterValues> =
                filters.ticketCategoryId &&
                !nextCategories.some((category) => category.id === filters.ticketCategoryId)
                  ? { ...filters, ticketCategoryId: "" }
                  : filters;

              await syncWorkspace(nextFilters, selectedTicketId);
              setFeedback({
                tone: "success",
                message: "Ticket category deleted.",
              });
            } catch (error) {
              setFeedback({
                tone: "error",
                message: getTicketErrorMessage(error, "Could not delete the ticket category."),
              });
            } finally {
              setIsMutating(false);
            }
          }}
        />
      ) : null}
    </>
  );
}
