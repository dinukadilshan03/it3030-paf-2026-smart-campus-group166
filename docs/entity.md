# Entity Design

## Overview

This entity model is designed for the **Smart Campus Operations Hub** and covers all required processes:
- facilities and assets catalogue
- booking workflow and approval
- maintenance and incident ticketing
- ticket assignment
- ticket conversation between student and staff
- notifications
- authentication and authorization

The design is based on the coursework requirements for:
- resource metadata, location, status, and availability
- booking requests with approval/rejection and conflict prevention
- incident tickets with category, priority, attachments, assignment, and comments
- in-app notifications
- role-based access control with Google OAuth login. :contentReference[oaicite:0]{index=0}

---

## Role Model

The system uses 3 main access layers:

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
- comment on tickets
- manage operational work related to assigned issues

### `ADMIN`
Can:
- manage resources, categories, and locations
- approve or reject bookings
- view all bookings
- view and assign all tickets
- manage roles and operational settings
- oversee the full system

---

## Entity List

1. `users`
2. `roles`
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

### 1. `users`

**Purpose:**  
Stores all authenticated users in the system.

**Fields:**
- `id`
- `google_sub`
- `email`
- `first_name`
- `last_name`
- `display_name`
- `phone`
- `profile_image_url`
- `status` (`ACTIVE`, `INACTIVE`, `SUSPENDED`)
- `created_at`
- `updated_at`
- `last_login_at`

**Notes:**
- Created when a user signs in through Google OAuth
- Used by bookings, tickets, comments, notifications, and role assignment

---

### 2. `roles`

**Purpose:**  
Defines available system roles.

**Fields:**
- `id`
- `code` (`STUDENT`, `STAFF`, `ADMIN`)
- `name`
- `description`

---

### 3. `user_roles`

**Purpose:**  
Maps users to roles.

**Fields:**
- `id`
- `user_id`
- `role_id`
- `assigned_at`
- `assigned_by`

**Notes:**
- Allows flexibility if one user needs multiple roles later

---

### 4. `locations`

**Purpose:**  
Stores location details for resources and tickets.

**Fields:**
- `id`
- `code`
- `name`
- `building`
- `floor`
- `room_identifier`
- `description`
- `created_at`
- `updated_at`

**Notes:**
- Shared by resource management and incident ticketing

---

### 5. `resource_categories`

**Purpose:**  
Classifies resources into types.

**Examples:**
- lecture hall
- lab
- meeting room
- projector
- camera

**Fields:**
- `id`
- `code`
- `name`
- `description`
- `is_active`
- `created_at`
- `updated_at`

---

### 6. `resources`

**Purpose:**  
Stores all bookable assets and facilities.

**Fields:**
- `id`
- `resource_category_id`
- `location_id`
- `resource_code`
- `name`
- `description`
- `capacity`
- `status` (`ACTIVE`, `OUT_OF_SERVICE`, `MAINTENANCE`, `INACTIVE`)
- `requires_approval`
- `image_url`
- `notes`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

**Notes:**
- Main catalogue entity for facilities and assets
- Must support filtering by type, capacity, and location as required in the brief. :contentReference[oaicite:1]{index=1}

---

### 7. `resource_availability_windows`

**Purpose:**  
Defines standard availability windows for each resource.

**Fields:**
- `id`
- `resource_id`
- `day_of_week`
- `start_time`
- `end_time`
- `is_available`
- `effective_from`
- `effective_to`
- `created_at`
- `updated_at`

**Notes:**
- Supports the requirement that resources include availability windows. :contentReference[oaicite:2]{index=2}

---

### 8. `bookings`

**Purpose:**  
Stores booking requests and booking lifecycle data.

**Fields:**
- `id`
- `resource_id`
- `requester_user_id`
- `booking_date`
- `start_time`
- `end_time`
- `purpose`
- `expected_attendees`
- `request_notes`
- `status` (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`)
- `reviewed_by`
- `reviewed_at`
- `review_reason`
- `cancelled_by`
- `cancelled_at`
- `cancellation_reason`
- `created_at`
- `updated_at`

**Notes:**
- Supports approval/rejection workflow
- Supports cancellation after approval
- Time overlap validation should be enforced in backend service logic
- Covers booking date, time range, purpose, and attendees from the brief. :contentReference[oaicite:3]{index=3}

---

### 9. `ticket_categories`

**Purpose:**  
Classifies maintenance and incident tickets.

**Examples:**
- electrical
- network
- equipment_damage
- cleanliness
- access_issue

**Fields:**
- `id`
- `code`
- `name`
- `description`
- `is_active`
- `created_at`
- `updated_at`

---

### 10. `tickets`

**Purpose:**  
Stores the main maintenance or incident ticket record.

**Fields:**
- `id`
- `ticket_number`
- `reporter_user_id`
- `assigned_staff_user_id`
- `resource_id` nullable
- `location_id` nullable
- `ticket_category_id`
- `title`
- `description`
- `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
- `status` (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REJECTED`)
- `preferred_contact_name`
- `preferred_contact_email`
- `preferred_contact_phone`
- `resolution_summary`
- `rejection_reason`
- `resolved_at`
- `closed_at`
- `created_at`
- `updated_at`

**Notes:**
- Supports ticket creation, assignment, status changes, and closure
- `resource_id` is optional because some incidents may refer only to a location
- Covers category, description, priority, and preferred contact details from the brief. :contentReference[oaicite:4]{index=4}

---

### 11. `ticket_attachments`

**Purpose:**  
Stores metadata for ticket evidence uploads.

**Fields:**
- `id`
- `ticket_id`
- `uploaded_by`
- `file_name`
- `storage_bucket`
- `storage_path`
- `mime_type`
- `file_size`
- `attachment_type`
- `created_at`

**Notes:**
- Files are stored in Supabase Storage
- Backend should enforce the rule of up to 3 attachments per ticket. :contentReference[oaicite:5]{index=5}

---

### 12. `ticket_comments`

**Purpose:**  
Stores the conversation thread for each ticket.

**Fields:**
- `id`
- `ticket_id`
- `author_user_id`
- `body`
- `comment_type` (`PUBLIC_REPLY`, `INTERNAL_NOTE`, `STATUS_NOTE`)
- `parent_comment_id` nullable
- `is_edited`
- `edited_at`
- `created_at`
- `updated_at`

**Notes:**
- This entity handles the conversation between student and staff
- `PUBLIC_REPLY` is visible to reporter and staff/admin
- `INTERNAL_NOTE` is visible only to staff/admin
- `STATUS_NOTE` can be generated automatically for assignment or status changes
- Ownership rules for edit/delete should be enforced by role and comment author
- This directly supports the brief’s requirement for comments and ownership rules. :contentReference[oaicite:6]{index=6}

---

### 13. `ticket_assignments`

**Purpose:**  
Tracks ticket assignment history.

**Fields:**
- `id`
- `ticket_id`
- `assigned_to_user_id`
- `assigned_by_user_id`
- `assignment_note`
- `assigned_at`
- `unassigned_at`
- `is_active`

**Notes:**
- Keeps historical assignment records
- Useful for reassignment and audit history
- Better than relying only on `assigned_staff_user_id` in `tickets`

---

### 14. `notifications`

**Purpose:**  
Stores in-app notifications for users.

**Fields:**
- `id`
- `user_id`
- `type` (`BOOKING`, `TICKET`, `COMMENT`, `SYSTEM`)
- `title`
- `message`
- `reference_type` (`BOOKING`, `TICKET`, `COMMENT`)
- `reference_id`
- `is_read`
- `read_at`
- `created_at`

**Notes:**
- Supports booking approval/rejection notifications
- Supports ticket status change notifications
- Supports new comment notifications
- Matches the notification requirements in the brief. :contentReference[oaicite:7]{index=7}

---

### 15. `audit_logs`

**Purpose:**  
Stores important system activity for traceability.

**Fields:**
- `id`
- `actor_user_id`
- `entity_type`
- `entity_id`
- `action`
- `old_value_json`
- `new_value_json`
- `created_at`

**Notes:**
- Recommended for admin tracking, debugging, and report evidence
- Not strictly required, but very useful for demonstrating workflow changes

---

## Entity Relationships

### User and role relationships
- one `user` can have many `user_roles`
- one `role` can have many `user_roles`

### Resource relationships
- one `resource_category` can have many `resources`
- one `location` can have many `resources`
- one `resource` can have many `resource_availability_windows`
- one `resource` can have many `bookings`

### Booking relationships
- one `user` can create many `bookings`
- one `booking` belongs to one `resource`

### Ticket relationships
- one `user` can create many `tickets`
- one `staff` user can be assigned many `tickets`
- one `ticket_category` can have many `tickets`
- one `location` can have many `tickets`
- one `resource` can have many `tickets`
- one `ticket` can have many `ticket_attachments`
- one `ticket` can have many `ticket_comments`
- one `ticket` can have many `ticket_assignments`

### Notification relationships
- one `user` can have many `notifications`

---

## Enums

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

---

## Design Notes

### Facilities and assets module
Requires:
- `resource_categories`
- `resources`
- `locations`
- `resource_availability_windows`

### Booking management module
Requires:
- `bookings`
- `resources`
- `users`

### Maintenance and incident ticketing module
Requires:
- `tickets`
- `ticket_categories`
- `ticket_attachments`
- `ticket_comments`
- `ticket_assignments`
- `locations`
- optional `resources`

### Notifications module
Requires:
- `notifications`

### Authentication and authorization module
Requires:
- `users`
- `roles`
- `user_roles`

---

## Final Notes

This entity design is intended to:
- satisfy all required coursework workflows
- support a clean Spring Boot REST API
- support a normalized Supabase Postgres schema
- support a clear Next.js frontend flow
- make individual team contributions easier to separate and document

Recommended next files:
- `docs/database/schema.md`
- `docs/database/relationships.md`
- `docs/api/endpoints.md`