# Tickets Module Reference

This document describes the current ticketing implementation.

## Scope

The tickets area covers:

- ticket creation and listing
- role-aware detail views
- assignment and reassignment
- lifecycle status updates
- public replies and internal notes
- attachment metadata management
- ticket category management

## Frontend Areas

- [frontend/src/app/(app)/tickets/page.tsx](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/app/(app)/tickets/page.tsx)
- [frontend/src/components/tickets](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/components/tickets)
- [frontend/src/lib/tickets](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/lib/tickets)

## Backend Areas

- [backend/src/main/java/com/smartcampus/backend/modules/ticket](/C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/ticket)

## Access Model

- `STUDENT` can create tickets, view own tickets, and add public replies
- `STAFF` can work assigned tickets, update status, and add public replies or internal notes
- `ADMIN` can view all tickets, assign staff, update status, and manage categories

## Main Endpoints

- `GET /api/v1/ticket-categories`
- `GET /api/v1/tickets`
- `GET /api/v1/tickets/{id}`
- `POST /api/v1/tickets`
- `PATCH /api/v1/tickets/{id}/assignment`
- `PATCH /api/v1/tickets/{id}/status`
- `GET /api/v1/tickets/{id}/comments`
- `POST /api/v1/tickets/{id}/comments`
- `GET /api/v1/tickets/{id}/attachments`
- `POST /api/v1/tickets/{id}/attachments`
- `DELETE /api/v1/tickets/{ticketId}/attachments/{attachmentId}`

List filters:

- `status`
- `priority`
- `ticketCategoryId`
- `search`

## Key Backend Rules

- the ticket category must exist and be active
- at least one of `resourceId` or `locationId` is required
- resource and location must be consistent when both are provided
- ticket numbers are generated in the backend
- status transitions are restricted by workflow rules
- resolving a ticket requires a resolution summary
- rejecting a ticket requires a rejection reason
- assignment writes history and system comments
- internal notes are not visible to student reporters
- attachment count is capped at three per ticket

## Attachment Note

The backend supports attachment metadata and storage coordination. If you change attachment flows, verify both the frontend form behavior and the backend storage settings together.

## Notes For Contributors

- keep role-based UI controls aligned with backend access rules
- rely on backend validation for transition failures
- prioritize readable ticket detail and conversation flows when making UI changes
