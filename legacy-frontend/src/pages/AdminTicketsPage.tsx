import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  assignTechnician,
  createTicketComment,
  deleteTicketComment,
  getTicketDetails,
  getTickets,
  updateTicketComment,
  updateTicketWorkflow,
} from '../services/ticketService';
import { getUsers } from '../services/userService';
import type { User } from '../types/auth';
import type {
  TicketComment,
  TicketDetails,
  TicketPriority,
  TicketStatus,
  TicketSummary,
} from '../types/ticket';

const statusOptions: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];
const priorityOptions: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const workflowOptions: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['OPEN', 'IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['IN_PROGRESS', 'RESOLVED', 'REJECTED'],
  RESOLVED: ['RESOLVED', 'IN_PROGRESS', 'CLOSED'],
  CLOSED: ['CLOSED'],
  REJECTED: ['REJECTED'],
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatFileSize(bytes: number | null) {
  if (!bytes) {
    return 'Unknown size';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminTicketsPage() {
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetails | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [workflowStatus, setWorkflowStatus] = useState<TicketStatus>('OPEN');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [assignmentTechnicianId, setAssignmentTechnicianId] = useState('');
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stats = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === 'OPEN').length,
      inProgress: tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length,
      resolved: tickets.filter((ticket) => ticket.status === 'RESOLVED').length,
    }),
    [tickets]
  );

  const currentTicket = selectedTicket?.ticket ?? null;
  const allowedWorkflowStatuses = currentTicket ? workflowOptions[currentTicket.status] : statusOptions;
  const canAssign = currentTicket ? !['CLOSED', 'REJECTED'].includes(currentTicket.status) : false;

  const syncWorkflowForm = (detail: TicketDetails) => {
    setWorkflowStatus(detail.ticket.status);
    setResolutionNotes(detail.ticket.resolutionNotes ?? '');
    setRejectionReason(detail.ticket.rejectionReason ?? '');
  };

  const loadTicketDetail = async (ticketId: number) => {
    setIsDetailLoading(true);

    try {
      const detail = await getTicketDetails(ticketId);
      setSelectedTicket(detail);
      setSelectedTicketId(ticketId);
      syncWorkflowForm(detail);
      setAssignmentTechnicianId('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load ticket details.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const loadTickets = async (preferredTicketId?: number | null) => {
    const nextTickets = await getTickets({
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      category: categoryFilter || undefined,
      search: search || undefined,
    });

    setTickets(nextTickets);

    const nextSelectedId =
      preferredTicketId && nextTickets.some((ticket) => ticket.id === preferredTicketId)
        ? preferredTicketId
        : nextTickets[0]?.id ?? null;

    setSelectedTicketId(nextSelectedId);

    if (nextSelectedId) {
      await loadTicketDetail(nextSelectedId);
    } else {
      setSelectedTicket(null);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);
      setError('');

      try {
        const technicianUsers = await getUsers({ role: 'TECHNICIAN' });
        setTechnicians(technicianUsers);
        await loadTickets();
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load admin ticket data.');
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap().catch(() => undefined);
  }, []);

  const handleFilterSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await loadTickets(selectedTicketId);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to apply ticket filters.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCurrentTicket = async () => {
    if (!selectedTicketId) {
      return;
    }

    await loadTickets(selectedTicketId);
  };

  const handleWorkflowSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentTicket) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await updateTicketWorkflow(currentTicket.id, {
        status: workflowStatus,
        resolutionNotes: resolutionNotes.trim() || undefined,
        rejectionReason: rejectionReason.trim() || undefined,
      });
      await refreshCurrentTicket();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update ticket workflow.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignTechnician = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentTicket || !assignmentTechnicianId) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await assignTechnician(currentTicket.id, Number(assignmentTechnicianId));
      setAssignmentTechnicianId('');
      await refreshCurrentTicket();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to assign technician.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentTicket || !newComment.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createTicketComment(currentTicket.id, newComment.trim());
      setNewComment('');
      await loadTicketDetail(currentTicket.id);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to add comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditingComment = (comment: TicketComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!currentTicket || !editingCommentContent.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await updateTicketComment(currentTicket.id, commentId, editingCommentContent.trim());
      setEditingCommentId(null);
      setEditingCommentContent('');
      await loadTicketDetail(currentTicket.id);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!currentTicket || !window.confirm('Delete this comment?')) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await deleteTicketComment(currentTicket.id, commentId);
      await loadTicketDetail(currentTicket.id);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="app-shell">
        <header className="topbar panel">
          <div>
            <span className="eyebrow">Maintenance</span>
            <h1>Admin ticket operations</h1>
            <p>
              Signed in as {user?.name} ({user?.role})
            </p>
          </div>
          <div className="button-row">
            <Link className="secondary-button" to="/app">
              Dashboard
            </Link>
            <button className="secondary-button" onClick={() => loadTickets(selectedTicketId)}>
              Refresh
            </button>
            <button className="ghost-button" onClick={() => logout()}>
              Sign Out
            </button>
          </div>
        </header>

        {error ? <div className="status-banner error">{error}</div> : null}

        <section className="stat-row">
          <div className="stat-card">
            <p className="stat-label">Total tickets</p>
            <p className="stat-value">{stats.total}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Open queue</p>
            <p className="stat-value">{stats.open}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">In progress</p>
            <p className="stat-value">{stats.inProgress}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Resolved</p>
            <p className="stat-value">{stats.resolved}</p>
          </div>
        </section>

        <section className="panel">
          <span className="eyebrow">Filters</span>
          <h2 className="section-title">Ticket queue</h2>
          <form className="toolbar" onSubmit={handleFilterSubmit}>
            <div className="filter">
              <label>
                Search
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Reporter, resource, category"
                />
              </label>
            </div>
            <div className="filter">
              <label>
                Status
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="">All statuses</option>
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="filter">
              <label>
                Priority
                <select
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value)}
                >
                  <option value="">All priorities</option>
                  {priorityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="filter">
              <label>
                Category
                <input
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  placeholder="Electrical, network, hardware"
                />
              </label>
            </div>
            <div className="button-row">
              <button className="primary-button" type="submit">
                Apply Filters
              </button>
            </div>
          </form>
        </section>

        <div className="ticket-admin-grid">
          <aside className="panel ticket-admin-list-panel">
            <div className="ticket-admin-list-header">
              <span className="eyebrow">Ticket list</span>
              <p className="helper-text">
                {isLoading ? 'Loading tickets...' : `${tickets.length} ticket(s) found`}
              </p>
            </div>

            <div className="ticket-admin-list">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  className={`ticket-list-card${ticket.id === selectedTicketId ? ' active' : ''}`}
                  type="button"
                  onClick={() => loadTicketDetail(ticket.id)}
                >
                  <div className="ticket-list-card-head">
                    <span className={`badge ticket-status-${ticket.status}`}>{ticket.status}</span>
                    <span className={`badge ticket-priority-${ticket.priority}`}>{ticket.priority}</span>
                  </div>
                  <strong>{ticket.resourceName}</strong>
                  <p className="muted ticket-list-copy">{ticket.category}</p>
                  <p className="muted ticket-list-copy">{ticket.reportedByName}</p>
                  <p className="muted ticket-list-copy">{formatDate(ticket.createdAt)}</p>
                  <p className="ticket-list-assignee">
                    {ticket.currentAssignment
                      ? `Assigned to ${ticket.currentAssignment.technicianName}`
                      : 'Unassigned'}
                  </p>
                </button>
              ))}

              {!isLoading && tickets.length === 0 ? (
                <div className="status-banner info">
                  No maintenance tickets match the current filters.
                </div>
              ) : null}
            </div>
          </aside>

          <section className="panel ticket-detail-panel">
            {!currentTicket ? (
              <div className="status-banner info">
                Select a ticket from the queue to view details and admin actions.
              </div>
            ) : (
              <>
                <div className="ticket-detail-header">
                  <div>
                    <span className="eyebrow">Ticket #{currentTicket.id}</span>
                    <h2 className="section-title">{currentTicket.resourceName}</h2>
                    <p className="helper-text">
                      Reported by {currentTicket.reportedByName} on {formatDate(currentTicket.createdAt)}
                    </p>
                  </div>
                  <div className="ticket-detail-badges">
                    <span className={`badge ticket-status-${currentTicket.status}`}>
                      {currentTicket.status}
                    </span>
                    <span className={`badge ticket-priority-${currentTicket.priority}`}>
                      {currentTicket.priority}
                    </span>
                  </div>
                </div>

                {isDetailLoading ? <div className="status-banner info">Loading details...</div> : null}

                <div className="ticket-detail-grid">
                  <article className="ticket-detail-card">
                    <h3>Issue details</h3>
                    <dl className="ticket-detail-meta">
                      <div>
                        <dt>Category</dt>
                        <dd>{currentTicket.category}</dd>
                      </div>
                      <div>
                        <dt>Resource</dt>
                        <dd>
                          {currentTicket.resourceName}
                          {currentTicket.resourceLocation
                            ? `, ${currentTicket.resourceLocation}`
                            : ''}
                        </dd>
                      </div>
                      <div>
                        <dt>Reporter</dt>
                        <dd>{currentTicket.reportedByEmail}</dd>
                      </div>
                      <div>
                        <dt>Preferred contact</dt>
                        <dd>{currentTicket.preferredContact || 'Not provided'}</dd>
                      </div>
                    </dl>
                    <p className="ticket-detail-description">{currentTicket.description}</p>
                  </article>

                  <article className="ticket-detail-card">
                    <h3>Assignment</h3>
                    <p className="helper-text">
                      {currentTicket.currentAssignment
                        ? `Current technician: ${currentTicket.currentAssignment.technicianName}`
                        : 'No technician assigned yet.'}
                    </p>
                    <form className="stack" onSubmit={handleAssignTechnician}>
                      <div className="field">
                        <label>
                          Assign technician
                          <select
                            value={assignmentTechnicianId}
                            onChange={(event) => setAssignmentTechnicianId(event.target.value)}
                            disabled={!canAssign || technicians.length === 0}
                          >
                            <option value="">Select technician</option>
                            {technicians.map((technician) => (
                              <option key={technician.userId} value={technician.userId}>
                                {technician.name} ({technician.email})
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="button-row">
                        <button
                          className="primary-button"
                          type="submit"
                          disabled={isSubmitting || !assignmentTechnicianId || !canAssign}
                        >
                          Assign
                        </button>
                      </div>
                    </form>
                    {technicians.length === 0 ? (
                      <p className="helper-text">
                        No technician accounts exist yet. Create one from the user management page.
                      </p>
                    ) : null}
                  </article>

                  <article className="ticket-detail-card">
                    <h3>Workflow</h3>
                    <form className="stack" onSubmit={handleWorkflowSubmit}>
                      <div className="field">
                        <label>
                          Status
                          <select
                            value={workflowStatus}
                            onChange={(event) => {
                              const nextStatus = event.target.value as TicketStatus;
                              setWorkflowStatus(nextStatus);
                              if (nextStatus !== 'REJECTED') {
                                setRejectionReason('');
                              }
                              if (nextStatus !== 'RESOLVED' && nextStatus !== 'CLOSED') {
                                setResolutionNotes('');
                              }
                            }}
                          >
                            {allowedWorkflowStatuses.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      {workflowStatus === 'RESOLVED' || workflowStatus === 'CLOSED' ? (
                        <div className="field">
                          <label>
                            Resolution notes
                            <textarea
                              rows={4}
                              value={resolutionNotes}
                              onChange={(event) => setResolutionNotes(event.target.value)}
                              placeholder="Explain the fix, replaced parts, or final outcome."
                            />
                          </label>
                        </div>
                      ) : null}

                      {workflowStatus === 'REJECTED' ? (
                        <div className="field">
                          <label>
                            Rejection reason
                            <textarea
                              rows={4}
                              value={rejectionReason}
                              onChange={(event) => setRejectionReason(event.target.value)}
                              placeholder="Explain why the ticket cannot proceed."
                            />
                          </label>
                        </div>
                      ) : null}

                      <div className="button-row">
                        <button className="primary-button" type="submit" disabled={isSubmitting}>
                          Update Workflow
                        </button>
                      </div>
                    </form>
                  </article>

                  <article className="ticket-detail-card">
                    <h3>Attachments</h3>
                    {selectedTicket!.attachments.length === 0 ? (
                      <p className="helper-text">No image attachments were submitted for this ticket.</p>
                    ) : (
                      <div className="ticket-attachment-list">
                        {selectedTicket!.attachments.map((attachment) => (
                          <a
                            className="ticket-attachment-item"
                            key={attachment.id}
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <strong>{attachment.fileName}</strong>
                            <span>{attachment.fileType || 'image/*'}</span>
                            <span>{formatFileSize(attachment.fileSize)}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </article>
                </div>

                <div className="ticket-detail-card">
                  <h3>Assignment history</h3>
                  {selectedTicket!.assignments.length === 0 ? (
                    <p className="helper-text">No assignment history recorded yet.</p>
                  ) : (
                    <div className="ticket-history-list">
                      {selectedTicket!.assignments.map((assignment) => (
                        <div className="ticket-history-item" key={assignment.id}>
                          <strong>{assignment.technicianName}</strong>
                          <span>{assignment.technicianEmail}</span>
                          <span>
                            Assigned by {assignment.assignedByName} on {formatDate(assignment.assignedAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ticket-detail-card">
                  <div className="ticket-comments-head">
                    <h3>Comments</h3>
                    <p className="helper-text">
                      Admin comments are part of the ticket audit trail.
                    </p>
                  </div>

                  <form className="stack" onSubmit={handleAddComment}>
                    <div className="field">
                      <label>
                        Add comment
                        <textarea
                          rows={4}
                          value={newComment}
                          onChange={(event) => setNewComment(event.target.value)}
                          placeholder="Post an update, next action, or resolution detail."
                        />
                      </label>
                    </div>
                    <div className="button-row">
                      <button
                        className="primary-button"
                        type="submit"
                        disabled={isSubmitting || !newComment.trim()}
                      >
                        Post Comment
                      </button>
                    </div>
                  </form>

                  <div className="ticket-comment-list">
                    {selectedTicket!.comments.map((comment) => (
                      <article className="ticket-comment-card" key={comment.id}>
                        <div className="ticket-comment-meta">
                          <strong>{comment.userName}</strong>
                          <span>{comment.userEmail}</span>
                          <span>{formatDate(comment.updatedAt)}</span>
                        </div>

                        {editingCommentId === comment.id ? (
                          <div className="stack">
                            <textarea
                              rows={4}
                              value={editingCommentContent}
                              onChange={(event) => setEditingCommentContent(event.target.value)}
                            />
                            <div className="button-row">
                              <button
                                className="primary-button"
                                type="button"
                                disabled={isSubmitting || !editingCommentContent.trim()}
                                onClick={() => handleUpdateComment(comment.id)}
                              >
                                Save
                              </button>
                              <button
                                className="ghost-button"
                                type="button"
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingCommentContent('');
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="ticket-comment-content">{comment.content}</p>
                            <div className="inline-actions">
                              <button
                                className="secondary-button"
                                type="button"
                                onClick={() => startEditingComment(comment)}
                              >
                                Edit
                              </button>
                              <button
                                className="ghost-button"
                                type="button"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </article>
                    ))}

                    {selectedTicket!.comments.length === 0 ? (
                      <div className="status-banner info">No comments on this ticket yet.</div>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
