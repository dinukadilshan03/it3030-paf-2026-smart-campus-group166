# System Workflows

This document summarizes the main SmartCampus workflows in the current application.

## Resource Management

Goal: allow admins to manage facilities, assets, and availability schedules.

Flow:

1. An authenticated user browses resources.
2. An admin creates or updates categories, locations, and resources.
3. An admin manages availability windows for each resource.
4. The frontend reflects resource metadata and availability-driven booking rules.

Key rules:

- only admins can mutate resource data
- every resource belongs to a category and location
- availability validation is backend-owned
- resource images and ticket files use Supabase-backed storage configuration

## Booking Workflow

Goal: allow booking requests and admin review.

Flow:

1. A student or admin selects a resource.
2. The requester submits the booking date, time range, and purpose.
3. The backend validates availability and overlap rules.
4. The booking is created as `PENDING` or `APPROVED` depending on the resource policy.
5. An admin can approve, reject, or cancel as allowed.
6. The requester can cancel allowed bookings.

Key rules:

- overlapping active bookings are blocked
- rejected and cancelled bookings no longer block future requests
- approval checks are re-run during admin review

## Ticket Workflow

Goal: allow campus issue reporting and operational handling.

Flow:

1. A user creates a ticket with category, description, and context.
2. The backend creates the ticket and optional attachment metadata.
3. Admins assign or reassign tickets to staff.
4. Staff or admins move tickets through the supported lifecycle.
5. Users, staff, and admins collaborate through comments based on role visibility.

Key rules:

- the supported path is `OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED`
- admin rejection is supported from `OPEN`
- internal notes are staff/admin only
- attachment count is limited

## Notification Workflow

Goal: keep users informed about important changes.

Typical triggers:

- booking review outcomes
- ticket assignment events
- ticket status changes
- ticket comment activity

The backend creates notification records and the frontend renders them in the notifications area.

## Authentication Workflow

Goal: authenticate users and establish a valid session.

Flow:

1. Students authenticate with Google OAuth.
2. Staff and admins authenticate with local credentials.
3. The backend resolves the active role and user status.
4. The frontend boots from `/api/v1/auth/me`.
5. Password-change enforcement is applied for temporary local credentials.

Key rules:

- students cannot use local login
- staff/admins cannot use student Google login
- blocked or invalid accounts are rejected by the backend

## Authorization Model

The backend is the source of truth for authorization. The frontend mirrors role behavior in navigation and controls.

Role summary:

- `STUDENT`: resources, own bookings, own tickets, profile
- `STAFF`: assigned ticket workspace, resources, profile
- `ADMIN`: full management access across users, resources, bookings, tickets, notifications, analytics, and profile
