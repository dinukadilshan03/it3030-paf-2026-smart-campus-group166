# Ticket Component Handoff

## Scope

This module is the ticketing workflow. The backend is fully implemented for category management, ticket creation, role-aware list/detail, assignment, lifecycle transitions, comments, and attachment metadata. The frontend route is still a placeholder.

Route to replace:

- [frontend/src/app/(app)/tickets/page.tsx](C:/Users/dinuka/Documents/SmartCampus/frontend/src/app/(app)/tickets/page.tsx)

Relevant backend module:

- [backend/src/main/java/com/smartcampus/backend/modules/ticket](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/ticket)

## What Is Already Done

### Backend coverage

Implemented backend areas:

- ticket categories
- ticket creation
- role-aware list and detail
- assignment and reassignment to staff
- lifecycle status updates
- comments
- attachment metadata

Main backend files:

- [TicketController.java](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/ticket/controller/TicketController.java)
- [TicketCategoryController.java](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/ticket/controller/TicketCategoryController.java)
- [TicketCommentController.java](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/ticket/controller/TicketCommentController.java)
- [TicketAttachmentController.java](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/ticket/controller/TicketAttachmentController.java)
- [TicketService.java](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/ticket/service/TicketService.java)
- [TicketCommentService.java](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/ticket/service/TicketCommentService.java)
- [TicketAttachmentService.java](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/ticket/service/TicketAttachmentService.java)
- [TicketCategoryService.java](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/ticket/service/TicketCategoryService.java)

### Access model

- `STUDENT`
  - create tickets
  - view only own tickets
  - add public replies
- `STAFF`
  - view only currently assigned tickets
  - update assigned ticket status
  - add public replies and internal notes
- `ADMIN`
  - view all tickets
  - assign/reassign tickets to staff
  - update any ticket status
  - manage ticket categories

### Business rules already enforced in backend

- ticket category must exist and be active
- at least one of `resourceId` or `locationId` is required
- if both are present, the resource must belong to the same location
- ticket number is generated in backend
- default status is `OPEN`
- assignment writes assignment history
- assignment creates system status-note comment
- lifecycle transitions enforced:
  - `OPEN -> IN_PROGRESS`
  - `OPEN -> REJECTED`
  - `IN_PROGRESS -> RESOLVED`
  - `RESOLVED -> CLOSED`
- `RESOLVED` requires resolution summary
- `REJECTED` requires rejection reason
- each status change creates a system status-note comment
- internal notes are hidden from students/reporters
- attachment handling is metadata only
- max 3 attachments per ticket

## APIs You Should Use

### Categories

- `GET /api/v1/ticket-categories`
- `GET /api/v1/ticket-categories/{id}`
- `POST /api/v1/ticket-categories`
- `PATCH /api/v1/ticket-categories/{id}`
- `DELETE /api/v1/ticket-categories/{id}`

### Tickets

- `GET /api/v1/tickets`
- `GET /api/v1/tickets/{id}`
- `POST /api/v1/tickets`
- `PATCH /api/v1/tickets/{id}/assignment`
- `PATCH /api/v1/tickets/{id}/status`

Supported list filters:

- `status`
- `priority`
- `ticketCategoryId`
- `search`

### Comments

- `GET /api/v1/tickets/{id}/comments`
- `POST /api/v1/tickets/{id}/comments`

### Attachments

- `GET /api/v1/tickets/{id}/attachments`
- `POST /api/v1/tickets/{id}/attachments`
- `DELETE /api/v1/tickets/{ticketId}/attachments/{attachmentId}`

### Main DTOs

- `TicketSummaryResponse`
- `TicketDetailResponse`
- `CreateTicketRequest`
- `UpdateTicketAssignmentRequest`
- `UpdateTicketStatusRequest`
- `TicketCommentResponse`
- `CreateTicketCommentRequest`
- `TicketAttachmentResponse`
- `CreateTicketAttachmentRequest`
- `TicketCategorySummaryResponse`
- `TicketCategoryDetailResponse`

## What The Frontend Should Build

Recommended workflow split:

### Student side

- create ticket form
- my tickets list
- ticket detail with visible conversation
- add public replies

### Staff side

- assigned ticket work queue
- ticket detail
- internal notes
- status progression

### Admin side

- all-ticket management view
- assign or reassign to staff
- status changes
- category management

## Recommended UI Sections

1. Ticket list
- ticket number
- title
- category
- priority
- status
- assigned staff
- reporter info for admin

2. Ticket detail
- core ticket metadata
- linked resource/location if present
- assignment section
- status transition controls
- resolution/rejection fields when required

3. Comment thread
- public replies
- internal notes for staff/admin only
- clear visual distinction between public and internal
- system status notes rendered read-only

4. Attachment metadata section
- list uploaded attachment metadata
- add/remove metadata

5. Category manager
- admin-only CRUD

## Critical Note About Attachments

This module does not yet include real storage upload integration.

Only attachment metadata is implemented right now:

- `fileName`
- `storageBucket`
- `storagePath`
- `mimeType`
- `fileSize`
- `attachmentType`

Do not build a full upload-to-storage flow unless you coordinate a later storage implementation. For now, treat attachments as metadata entry/list/delete only.

## Suggested Frontend File Layout

Suggested new frontend area:

- `frontend/src/components/tickets`
- `frontend/src/lib/tickets`

Suggested files:

- `TicketWorkspacePage.tsx`
- `TicketFilters.tsx`
- `TicketList.tsx`
- `TicketDetailPanel.tsx`
- `CreateTicketForm.tsx`
- `AssignmentDialog.tsx`
- `StatusUpdateDialog.tsx`
- `TicketComments.tsx`
- `TicketAttachmentPanel.tsx`
- `TicketCategoryManager.tsx`
- `frontend/src/lib/tickets/api.ts`
- `frontend/src/lib/tickets/types.ts`

## Suggested Delivery Order

Build this first:

1. ticket list
2. ticket detail
3. create ticket form

Then add:

1. comments
2. staff/admin status actions
3. assignment flow

Then add:

1. category manager
2. attachment metadata management

## Practical Notes

- role-based behavior is already handled in backend and app shell
- frontend should show and hide controls based on role, but backend remains the source of truth
- use backend validation errors directly for transition failures
- ticket conversations are a big part of this workflow, so prioritize a clean detail view and thread UI early
- use the `/users` admin page as a pattern for list/detail/mutation refresh logic

