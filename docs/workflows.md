# System Workflows

## Overview

This document defines all core workflows required for the system based on the assignment specification.
Each workflow is written in a way that maps directly to backend logic, database entities, and frontend flows.

---

# 1. Resource Management Workflow (Admin)

## Goal

Allow admins to manage facilities and assets.

## Flow

1. Admin logs in

2. Navigates to **Resource Management**

3. Creates or edits:

   * Resource Category
   * Location
   * Resource

4. When creating a resource:

   * Select category (`resource_categories`)
   * Select location (`locations`)
   * Enter:

     * name
     * capacity
     * description
     * status
     * availability

5. Save resource → stored in `resources`

## Rules

* Only `ADMIN` can create/update/delete resources
* Resource must always have:

  * category
  * location
  * status
* Availability stored in `resource_availability_windows`

---

# 2. Booking Workflow

## Goal

Allow students to request bookings and admins to approve/reject.

## Flow

### Step 1 — Create Booking (Student)

1. Student selects resource
2. Inputs:

   * date
   * start_time
   * end_time
   * purpose
   * expected attendees
3. Submit request

→ Create `bookings` record:

* status = `PENDING`

---

### Step 2 — Conflict Validation (Backend)

Before saving:

* Check for overlapping bookings:

  * same `resource_id`
  * overlapping time range
  * status NOT in (`REJECTED`, `CANCELLED`)

If conflict:

* Reject request with error

---

### Step 3 — Admin Review

1. Admin views pending bookings

2. Admin chooses:

   * APPROVE
   * REJECT

3. If APPROVED:

   * status = `APPROVED`
   * set `reviewed_by`, `reviewed_at`

4. If REJECTED:

   * status = `REJECTED`
   * store `review_reason`

---

### Step 4 — Cancellation

* User or Admin cancels:

  * status = `CANCELLED`
  * store reason + timestamp

---

### Notifications Triggered

* Booking approved → notify user
* Booking rejected → notify user

---

# 3. Ticket Creation Workflow

## Goal

Allow students to report incidents.

## Flow

1. Student opens **Create Ticket**

2. Inputs:

   * category
   * title
   * description
   * priority
   * location OR resource
   * preferred contact details

3. Upload up to 3 images

4. Submit

→ Create:

* `tickets` (status = `OPEN`)
* `ticket_attachments`

---

## Rules

* Max 3 attachments
* Must have either:

  * `location_id` OR `resource_id`
* Default priority = `MEDIUM` if not provided

---

# 4. Ticket Assignment Workflow

## Goal

Admin assigns tickets to staff.

## Flow

1. Admin views unassigned tickets
2. Selects staff member
3. Assigns ticket

→ Updates:

* `tickets.assigned_staff_user_id`
* create record in `ticket_assignments`

→ System creates `STATUS_NOTE` comment

---

## Reassignment

* Admin can reassign:

  * deactivate previous assignment
  * create new assignment record

---

# 5. Ticket Lifecycle Workflow

## Goal

Track ticket progress.

## States

```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
                ↘ REJECTED
```

---

## Flow

### OPEN → IN_PROGRESS

* Staff starts working

### IN_PROGRESS → RESOLVED

* Staff marks issue fixed
* adds resolution summary

### RESOLVED → CLOSED

* Admin confirms completion

### Any → REJECTED

* Admin rejects ticket with reason

---

## Rules

* Only staff/admin can update status
* Student cannot change status
* All status changes create `STATUS_NOTE`

---

# 6. Ticket Conversation Workflow

## Goal

Enable communication between student and staff.

## Flow

1. User or staff adds comment

→ Create `ticket_comments` record

---

## Comment Types

### PUBLIC_REPLY

* Visible to:

  * student
  * staff
  * admin

### INTERNAL_NOTE

* Visible only to:

  * staff
  * admin

### STATUS_NOTE

* Auto-generated

---

## Ownership Rules

* User can edit/delete:

  * their own comments only
* Admin can:

  * moderate all comments

---

# 7. Notification Workflow

## Goal

Inform users of system events.

## Triggers

### Booking

* Approved
* Rejected

### Tickets

* Assigned
* Status changed
* Comment added

---

## Flow

1. Event occurs
2. Create `notifications` record
3. Display in UI

---

## Notification Structure

* title
* message
* reference_type
* reference_id

---

# 8. Authentication Workflow (Google OAuth)

## Flow

1. User clicks login

2. Redirect to Google OAuth

3. Google returns:

   * email
   * name
   * google_sub

4. Backend:

   * if user exists → login
   * else → create user

5. Assign default role:

   * STUDENT

6. Create session/JWT

---

## Rules

* All protected endpoints require authentication
* Role-based access enforced in backend

---

# 9. Authorization (RBAC)

## Access Control Matrix

| Action           | Student | Staff | Admin |
| ---------------- | ------- | ----- | ----- |
| View resources   | ✓       | ✓     | ✓     |
| Create booking   | ✓       | ✗     | ✓     |
| Approve booking  | ✗       | ✗     | ✓     |
| Create ticket    | ✓       | ✓     | ✓     |
| Assign ticket    | ✗       | ✗     | ✓     |
| Update ticket    | ✗       | ✓     | ✓     |
| View all tickets | ✗       | ✓     | ✓     |

---

# 10. System Integrity Rules

## Booking Rules

* No overlapping bookings
* Must have valid time range

## Ticket Rules

* Max 3 attachments
* Must have category
* Must have location OR resource

## Comment Rules

* Ownership enforced
* Internal notes restricted

## Resource Rules

* Must belong to category
* Must have location



