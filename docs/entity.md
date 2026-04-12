# Entity Design

## Overview

This document is the source of truth for the first SmartCampus database layer.
It defines the baseline schema that Spring Boot owns through Flyway migrations and that all team members share through the hosted Supabase PostgreSQL database.

Key v1 decisions:

- Spring Boot is the only application layer that connects to the database.
- Next.js consumes backend APIs and DTOs only.
- Supabase provides hosted PostgreSQL and Storage.
- All internal primary keys use `bigint` identity columns.
- `roles` and `user_roles` stay in the schema, but the system enforces one active role per user in v1.

---

## Role Model

### `STUDENT`

Can:

- browse resources
- create booking requests
- view own bookings
- create tickets
- upload ticket evidence
- comment on ticket conversations
- receive notifications

### `STAFF`

Can:

- view assigned tickets
- update ticket status
- add resolution notes
- add public replies and internal notes
- receive notifications related to assigned work

### `ADMIN`

Can:

- manage resources, categories, and locations
- approve or reject bookings
- view all bookings
- view and assign all tickets
- manage effective user roles
- oversee the full system

---

## Entity List

1. `roles`
2. `users`
3. `user_roles`
4. `locations`
5. `resource_categories`
6. `resources`
7. `resource_availability_windows`
8. `bookings`
9. `ticket_categories`
10. `tickets`
11. `ticket_attachments`
12. `ticket_comments`
13. `ticket_assignments`
14. `notifications`
15. `audit_logs`

---

## Entities

### 1. `roles`

Purpose: defines the fixed access roles available in the system.

Fields:

- `id`
- `code` (`STUDENT`, `STAFF`, `ADMIN`) unique
- `name`
- `description`

Notes:

- seeded by migration
- used with `user_roles` instead of a direct `role_id` on `users`

### 2. `users`

Purpose: stores authenticated people who use the platform.

Fields:

- `id`
- `google_sub` unique, nullable
- `email` unique, required
- `first_name`
- `last_name`
- `display_name`
- `phone`
- `profile_image_url`
- `status` (`ACTIVE`, `INACTIVE`, `SUSPENDED`) default `ACTIVE`
- `created_at`
- `updated_at`
- `last_login_at`

Notes:

- users are created or updated through the backend auth flow
- `google_sub` is unique when present

### 3. `user_roles`

Purpose: stores role assignment history while allowing exactly one active role per user in v1.

Fields:

- `id`
- `user_id`
- `role_id`
- `assigned_at`
- `assigned_by_user_id`
- `is_active` default `true`
- `ended_at`

Notes:

- partial unique index enforces only one active role per user
- old assignments remain as history rows when roles change later

### 4. `locations`

Purpose: stores reusable physical location records for resources and tickets.

Fields:

- `id`
- `code` unique
- `name`
- `building`
- `floor`
- `room_identifier`
- `description`
- `created_at`
- `updated_at`

### 5. `resource_categories`

Purpose: classifies managed facilities and assets.

Fields:

- `id`
- `code` unique
- `name`
- `description`
- `is_active` default `true`
- `created_at`
- `updated_at`

### 6. `resources`

Purpose: stores facilities and assets that can be managed and, when relevant, booked or referenced in tickets.

Fields:

- `id`
- `resource_category_id`
- `location_id`
- `resource_code` unique
- `name`
- `description`
- `capacity`
- `status` (`ACTIVE`, `OUT_OF_SERVICE`, `MAINTENANCE`, `INACTIVE`) default `ACTIVE`
- `requires_approval` default `true`
- `image_url`
- `notes`
- `created_by_user_id`
- `updated_by_user_id`
- `created_at`
- `updated_at`

Notes:

- `image_url` is expected to reference a Supabase Storage-backed asset
- `capacity` is non-negative when present

### 7. `resource_availability_windows`

Purpose: stores recurring availability rules for each resource.

Fields:

- `id`
- `resource_id`
- `day_of_week` (ISO-style `1-7`)
- `start_time`
- `end_time`
- `is_available` default `true`
- `effective_from`
- `effective_to`
- `created_at`
- `updated_at`

Notes:

- `start_time` must be earlier than `end_time`
- `effective_to` must be on or after `effective_from` when both exist

### 8. `bookings`

Purpose: stores booking requests and their review/cancellation lifecycle.

Fields:

- `id`
- `resource_id`
- `requester_user_id`
- `booking_date`
- `start_time`
- `end_time`
- `purpose`
- `expected_attendees`
- `request_notes`
- `status` (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`) default `PENDING`
- `reviewed_by_user_id`
- `reviewed_at`
- `review_reason`
- `cancelled_by_user_id`
- `cancelled_at`
- `cancellation_reason`
- `created_at`
- `updated_at`

Notes:

- booking overlap is validated in backend service logic, not by a DB unique constraint
- `start_time` must be earlier than `end_time`
- `expected_attendees` must be positive when present

### 9. `ticket_categories`

Purpose: classifies maintenance and incident tickets.

Fields:

- `id`
- `code` unique
- `name`
- `description`
- `is_active` default `true`
- `created_at`
- `updated_at`

### 10. `tickets`

Purpose: stores the main incident or maintenance record.

Fields:

- `id`
- `ticket_number` unique
- `reporter_user_id`
- `assigned_staff_user_id`
- `resource_id` nullable
- `location_id` nullable
- `ticket_category_id`
- `title`
- `description`
- `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) default `MEDIUM`
- `status` (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REJECTED`) default `OPEN`
- `preferred_contact_name`
- `preferred_contact_email`
- `preferred_contact_phone`
- `resolution_summary`
- `rejection_reason`
- `resolved_at`
- `closed_at`
- `created_at`
- `updated_at`

Notes:

- resource is preferred when the incident is tied to a managed asset or facility
- location is allowed as a fallback when there is no specific resource record
- at least one of `resource_id` or `location_id` must be present
- if both are present, backend validation must ensure the resource belongs to the same location
- `assigned_staff_user_id` stores current assignment, while `ticket_assignments` stores assignment history

### 11. `ticket_attachments`

Purpose: stores metadata for ticket evidence files.

Fields:

- `id`
- `ticket_id`
- `uploaded_by_user_id`
- `file_name`
- `storage_bucket`
- `storage_path` unique
- `mime_type`
- `file_size`
- `attachment_type`
- `created_at`

Notes:

- files live in Supabase Storage
- this table stores metadata only
- backend validation limits a ticket to 3 attachments

### 12. `ticket_comments`

Purpose: stores the conversation and system notes on a ticket.

Fields:

- `id`
- `ticket_id`
- `author_user_id`
- `body`
- `comment_type` (`PUBLIC_REPLY`, `INTERNAL_NOTE`, `STATUS_NOTE`)
- `parent_comment_id`
- `is_edited` default `false`
- `edited_at`
- `created_at`
- `updated_at`

Notes:

- `PUBLIC_REPLY` is visible to reporter, staff, and admin
- `INTERNAL_NOTE` is visible only to staff and admin
- `STATUS_NOTE` is system-generated for workflow events

### 13. `ticket_assignments`

Purpose: stores assignment history for each ticket.

Fields:

- `id`
- `ticket_id`
- `assigned_to_user_id`
- `assigned_by_user_id`
- `assignment_note`
- `assigned_at`
- `unassigned_at`
- `is_active` default `true`

Notes:

- only one active assignment is allowed per ticket
- older rows remain for audit history

### 14. `notifications`

Purpose: stores in-app notifications for users.

Fields:

- `id`
- `user_id`
- `type` (`BOOKING`, `TICKET`, `COMMENT`, `SYSTEM`)
- `title`
- `message`
- `reference_type` (`BOOKING`, `TICKET`, `COMMENT`) nullable
- `reference_id` nullable
- `is_read` default `false`
- `read_at`
- `created_at`

Notes:

- system-level notifications may have no reference

### 15. `audit_logs`

Purpose: stores important system changes for traceability.

Fields:

- `id`
- `actor_user_id`
- `entity_type`
- `entity_id`
- `action`
- `old_value_json`
- `new_value_json`
- `created_at`

Notes:

- JSON payloads are stored in PostgreSQL `jsonb`
- included from the start even if v1 uses it lightly

---

## Relationship Summary

- one `user` can have many `user_roles`, but only one active row at a time in v1
- one `role` can have many `user_roles`
- one `location` can have many `resources`
- one `resource_category` can have many `resources`
- one `resource` can have many `resource_availability_windows`
- one `resource` can have many `bookings`
- one `user` can create many `bookings`
- one `ticket_category` can have many `tickets`
- one `user` can report many `tickets`
- one `user` can be assigned to many `tickets`
- one `ticket` can have many `ticket_attachments`
- one `ticket` can have many `ticket_comments`
- one `ticket` can have many `ticket_assignments`
- one `user` can have many `notifications`

---

## Enum Set

### Role Codes

- `STUDENT`
- `STAFF`
- `ADMIN`

### User Status

- `ACTIVE`
- `INACTIVE`
- `SUSPENDED`

### Resource Status

- `ACTIVE`
- `OUT_OF_SERVICE`
- `MAINTENANCE`
- `INACTIVE`

### Booking Status

- `PENDING`
- `APPROVED`
- `REJECTED`
- `CANCELLED`

### Ticket Priority

- `LOW`
- `MEDIUM`
- `HIGH`
- `URGENT`

### Ticket Status

- `OPEN`
- `IN_PROGRESS`
- `RESOLVED`
- `CLOSED`
- `REJECTED`

### Comment Type

- `PUBLIC_REPLY`
- `INTERNAL_NOTE`
- `STATUS_NOTE`

### Notification Type

- `BOOKING`
- `TICKET`
- `COMMENT`
- `SYSTEM`

### Notification Reference Type

- `BOOKING`
- `TICKET`
- `COMMENT`

---

## Implementation Notes

- Flyway owns schema changes.
- JPA entities must match Flyway exactly.
- Supabase dashboard changes must not bypass migrations.
- Legacy folders are reference-only and do not define the new schema contract.

Recommended next docs:

- `docs/database/schema.md`
- `docs/database/relationships.md`
- `docs/api/endpoints.md`
