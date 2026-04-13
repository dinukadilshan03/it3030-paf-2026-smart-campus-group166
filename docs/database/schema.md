# Database Schema

## Purpose

This document mirrors the Flyway baseline schema in `backend/src/main/resources/db/migration/V1__create_baseline_schema.sql`.
If this file and the migration ever disagree, the migration wins and this doc should be updated immediately.

---

## Global Conventions

- all primary keys are `bigint` identity columns
- all foreign keys use explicit `_id` or `_user_id` naming
- enum-like values are stored as strings with database `check` constraints
- all schema changes must go through Flyway
- Spring Boot validates the schema at runtime instead of auto-mutating it

---

## Table Summary

### `roles`

- unique: `code`
- seed data: `STUDENT`, `STAFF`, `ADMIN`

### `users`

- unique: `email`, `google_sub`
- default: `status = ACTIVE`

### `user_roles`

- stores role assignment history
- default: `is_active = true`
- partial unique index: one active role per user

### `local_auth_credentials`

- unique: `user_id`
- required FK: `user_id`
- defaults:
  - `must_change_password = true`
  - `failed_attempt_count = 0`
- validation:
  - `failed_attempt_count >= 0`

### `locations`

- unique: `code`

### `resource_categories`

- unique: `code`
- default: `is_active = true`

### `resources`

- unique: `resource_code`
- required FKs: `resource_category_id`, `location_id`
- defaults:
  - `status = ACTIVE`
  - `requires_approval = true`

### `resource_availability_windows`

- required FK: `resource_id`
- validation:
  - `day_of_week` between `1` and `7`
  - `start_time < end_time`
  - effective range must be valid when both dates exist

### `bookings`

- required FKs: `resource_id`, `requester_user_id`
- optional FKs: `reviewed_by_user_id`, `cancelled_by_user_id`
- default: `status = PENDING`
- validation:
  - `start_time < end_time`
  - `expected_attendees > 0` when present

### `ticket_categories`

- unique: `code`
- default: `is_active = true`

### `tickets`

- unique: `ticket_number`
- required FKs: `reporter_user_id`, `ticket_category_id`
- optional FKs: `assigned_staff_user_id`, `resource_id`, `location_id`
- defaults:
  - `priority = MEDIUM`
  - `status = OPEN`
- validation:
  - at least one of `resource_id` or `location_id` must be present

### `ticket_attachments`

- required FKs: `ticket_id`, `uploaded_by_user_id`
- unique: `storage_path`
- validation: `file_size >= 0`

### `ticket_comments`

- required FKs: `ticket_id`, `author_user_id`
- optional self-reference: `parent_comment_id`
- defaults:
  - `is_edited = false`

### `ticket_assignments`

- required FKs: `ticket_id`, `assigned_to_user_id`, `assigned_by_user_id`
- default: `is_active = true`
- partial unique index: one active assignment per ticket

### `notifications`

- required FK: `user_id`
- optional reference: `reference_type`, `reference_id`
- default: `is_read = false`

### `audit_logs`

- optional FK: `actor_user_id`
- JSON columns:
  - `old_value_json`
  - `new_value_json`

---

## Business Rules Not Enforced Purely By Schema

- booking overlap detection
- ticket attachment max count of 3
- resource/location consistency when both are supplied on a ticket
- role-specific authorization rules
- ensuring assigned staff actually has a staff/admin role
- enforcing Google-only student auth vs local-only staff/admin auth
