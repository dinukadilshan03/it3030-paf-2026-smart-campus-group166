# System Workflows

## Overview

This document maps user workflows to the baseline schema defined in `docs/entity.md`.
It is intentionally aligned to the entity-first implementation: Spring Boot owns validation and workflow logic, while the shared Supabase database stores the persistent state.

---

## 1. Resource Management Workflow

Goal: allow admins to manage facilities and assets.

Flow:

1. Admin opens Resource Management.
2. Admin creates or edits:
   - `resource_categories`
   - `locations`
   - `resources`
   - `resource_availability_windows`
3. When creating a resource, the admin supplies:
   - category
   - location
   - name
   - capacity
   - description
   - status
   - approval requirement
4. Availability windows are stored separately for each resource.

Rules:

- only `ADMIN` can create, update, or delete resources
- every resource must belong to a category and location
- resource status must be one of the defined enum values
- resource images are expected to be backed by Supabase Storage

---

## 2. Booking Workflow

Goal: allow students to request bookings and admins to approve or reject them.

Flow:

1. Student selects a resource.
2. Student submits:
   - `booking_date`
   - `start_time`
   - `end_time`
   - `purpose`
   - optional `expected_attendees`
   - optional `request_notes`
3. Backend creates a `bookings` row with `status = PENDING`.
4. Admin reviews pending bookings.
5. Admin approves or rejects:
   - approved: set `status = APPROVED`, `reviewed_by_user_id`, `reviewed_at`
   - rejected: set `status = REJECTED`, `reviewed_by_user_id`, `reviewed_at`, `review_reason`
6. Student or admin can cancel later:
   - set `status = CANCELLED`
   - set `cancelled_by_user_id`, `cancelled_at`, `cancellation_reason`

Rules:

- booking overlap is checked in backend service logic
- overlap check ignores `REJECTED` and `CANCELLED`
- `start_time` must be earlier than `end_time`
- `expected_attendees` must be positive when provided

Notifications:

- booking approved -> notify requester
- booking rejected -> notify requester

---

## 3. Ticket Creation Workflow

Goal: allow users to report incidents and maintenance issues.

Flow:

1. User opens Create Ticket.
2. User submits:
   - category
   - title
   - description
   - optional priority
   - resource when a specific managed asset/facility is involved
   - location as fallback when there is no specific resource record
   - preferred contact details
3. User may upload up to 3 attachments.
4. Backend creates:
   - a `tickets` row with `status = OPEN`
   - up to 3 `ticket_attachments` rows storing Supabase Storage metadata

Rules:

- `priority` defaults to `MEDIUM`
- at least one of `resource_id` or `location_id` must be present
- if both are supplied, backend must validate that the resource belongs to that location
- files are stored in Supabase Storage; the database stores only metadata

---

## 4. Ticket Assignment Workflow

Goal: allow admins to assign tickets to staff and keep assignment history.

Flow:

1. Admin opens an unassigned or reassigned ticket.
2. Admin selects a staff user.
3. Backend updates:
   - `tickets.assigned_staff_user_id`
   - inserts a new `ticket_assignments` row with `is_active = true`
4. If the ticket had an active assignment already:
   - previous `ticket_assignments` row is closed with `is_active = false` and `unassigned_at`
5. System creates a `STATUS_NOTE` comment for the assignment event.

Rules:

- only one active assignment row is allowed per ticket
- `ticket_assignments` is the history table
- `tickets.assigned_staff_user_id` is the current-state shortcut

---

## 5. Ticket Lifecycle Workflow

Goal: track operational progress on a ticket.

State flow:

`OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED`

Rejection path:

`OPEN -> REJECTED`

Flow:

- staff/admin can move `OPEN` to `IN_PROGRESS`
- staff/admin can move `IN_PROGRESS` to `RESOLVED` and provide `resolution_summary`
- admin can move `RESOLVED` to `CLOSED`
- admin can reject a ticket with `rejection_reason`

Rules:

- student users do not change ticket status
- all status changes create `STATUS_NOTE` comments

---

## 6. Ticket Conversation Workflow

Goal: support communication around each ticket.

Flow:

1. Reporter, staff, or admin adds a comment.
2. Backend creates a `ticket_comments` row.

Comment types:

- `PUBLIC_REPLY`: visible to reporter, staff, and admin
- `INTERNAL_NOTE`: visible only to staff and admin
- `STATUS_NOTE`: system-generated workflow note

Ownership rules:

- users can edit or delete only their own comments when business rules allow it
- admin can moderate all comments

---

## 7. Notification Workflow

Goal: keep users informed about important events.

Triggers:

- booking approved
- booking rejected
- ticket assigned
- ticket status changed
- ticket comment added

Flow:

1. A backend workflow event occurs.
2. Backend creates a `notifications` row.
3. Frontend displays notifications from backend APIs.

Structure:

- `type`
- `title`
- `message`
- optional `reference_type`
- optional `reference_id`

---

## 8. Authentication Workflow

Goal: authenticate users and resolve one effective role for the app session.

Flow:

1. User signs in through Google OAuth.
2. Spring Boot handles the callback.
3. Backend finds or creates the `users` row.
4. Backend ensures the user has one active `user_roles` row.
5. Frontend consumes current user state from the backend API.

Rules:

- backend owns authentication and role resolution
- frontend does not connect directly to the database
- v1 uses one effective role per user even though the schema keeps role history

---

## 9. Authorization Workflow

Access model:

| Action | Student | Staff | Admin |
| --- | --- | --- | --- |
| View resources | Yes | Yes | Yes |
| Create booking | Yes | No | Yes |
| Approve booking | No | No | Yes |
| Create ticket | Yes | Yes | Yes |
| Assign ticket | No | No | Yes |
| Update ticket | No | Yes | Yes |
| View all tickets | No | Yes | Yes |

Rules:

- Spring Security enforces protected access
- role checks are resolved from the active `user_roles` row

---

## 10. Integrity Rules

Booking rules:

- no overlapping bookings for the same resource in active statuses
- valid time range required

Ticket rules:

- max 3 attachments
- valid category required
- at least one of resource or location required
- if both resource and location are present, they must be consistent

Comment rules:

- ownership rules enforced
- internal notes restricted to staff/admin

Role rules:

- only one active role per user in v1
- role history preserved through `user_roles`
