# Database Relationships

## Core Identity

- `users -> user_roles`: one-to-many
- `roles -> user_roles`: one-to-many
- v1 rule: a user can have many historical role rows, but only one active role row

---

## Resource Domain

- `locations -> resources`: one-to-many
- `resource_categories -> resources`: one-to-many
- `resources -> resource_availability_windows`: one-to-many
- `users -> resources.created_by_user_id`: many-to-one
- `users -> resources.updated_by_user_id`: many-to-one

---

## Booking Domain

- `resources -> bookings`: one-to-many
- `users -> bookings.requester_user_id`: one-to-many
- `users -> bookings.reviewed_by_user_id`: one-to-many
- `users -> bookings.cancelled_by_user_id`: one-to-many

Important logic:

- overlap checks use `resource_id + booking_date + time range`
- overlap is a service concern, not a DB uniqueness rule

---

## Ticket Domain

- `ticket_categories -> tickets`: one-to-many
- `users -> tickets.reporter_user_id`: one-to-many
- `users -> tickets.assigned_staff_user_id`: one-to-many
- `resources -> tickets`: one-to-many
- `locations -> tickets`: one-to-many
- `tickets -> ticket_attachments`: one-to-many
- `tickets -> ticket_comments`: one-to-many
- `tickets -> ticket_assignments`: one-to-many
- `ticket_comments -> ticket_comments.parent_comment_id`: self-reference

Important logic:

- each ticket must point to a resource, a location, or both
- when both resource and location are present, backend must confirm they match
- `tickets.assigned_staff_user_id` is current state
- `ticket_assignments` preserves full assignment history

---

## Notification and Audit Domain

- `users -> notifications`: one-to-many
- `users -> audit_logs.actor_user_id`: one-to-many

Notification references:

- `reference_type` can point conceptually to booking, ticket, or comment rows
- the relationship is polymorphic, so it is stored as `reference_type + reference_id`

---

## ERD Notes

Suggested ERD grouping:

- Identity: `users`, `roles`, `user_roles`
- Resource management: `locations`, `resource_categories`, `resources`, `resource_availability_windows`
- Booking: `bookings`
- Ticketing: `ticket_categories`, `tickets`, `ticket_attachments`, `ticket_comments`, `ticket_assignments`
- Cross-cutting: `notifications`, `audit_logs`
