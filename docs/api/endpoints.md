# API Endpoints

## Purpose

This is the initial API contract outline for the entity-first foundation.
It is intentionally small and backend-owned so the frontend can bootstrap against stable DTOs before feature endpoints expand.

---

## Baseline Endpoints

### `GET /api/v1/health`

Purpose:

- confirm the backend is running
- provide a safe readiness target for frontend and deployments

Response shape:

- `HealthResponse`

### `GET /api/v1/auth/me`

Purpose:

- return the authenticated user summary for the frontend shell

Response shape:

- `CurrentUserResponse`

### `POST /api/v1/auth/logout`

Purpose:

- invalidate the current backend session

---

## User Management Endpoints

### `GET /api/v1/users`

Purpose:

- return admin-facing user summaries

Query parameters:

- optional `role`
- optional `status`
- optional `search`

Response shape:

- collection of `UserSummaryResponse`

### `GET /api/v1/users/{id}`

Purpose:

- return one admin-facing user record

Response shape:

- `UserDetailResponse`

### `PATCH /api/v1/users/{id}`

Purpose:

- update allowed profile/admin fields

Request shape:

- `UpdateUserRequest`

### `PATCH /api/v1/users/{id}/role`

Purpose:

- change the effective role while preserving `user_roles` history

Request shape:

- `UpdateUserRoleRequest`

### `PATCH /api/v1/users/{id}/status`

Purpose:

- change user status with last-admin safety checks

Request shape:

- `UpdateUserStatusRequest`

---

## Resource Workflow Endpoints

### `GET /api/v1/resource-categories`

Purpose:

- return the resource category catalog for authenticated users

Response shape:

- collection of `ResourceCategorySummaryResponse`

### `GET /api/v1/resource-categories/{id}`

Purpose:

- return one resource category record

Response shape:

- `ResourceCategoryDetailResponse`

### `POST /api/v1/resource-categories`

Purpose:

- create a resource category

Access:

- admin only

Request shape:

- `CreateResourceCategoryRequest`

### `PATCH /api/v1/resource-categories/{id}`

Purpose:

- update a resource category

Access:

- admin only

Request shape:

- `UpdateResourceCategoryRequest`

### `DELETE /api/v1/resource-categories/{id}`

Purpose:

- delete a resource category when no resources still reference it

Access:

- admin only

### `GET /api/v1/locations`

Purpose:

- return the location catalog for authenticated users

Response shape:

- collection of `LocationSummaryResponse`

### `GET /api/v1/locations/{id}`

Purpose:

- return one location record

Response shape:

- `LocationDetailResponse`

### `POST /api/v1/locations`

Purpose:

- create a location

Access:

- admin only

Request shape:

- `CreateLocationRequest`

### `PATCH /api/v1/locations/{id}`

Purpose:

- update a location

Access:

- admin only

Request shape:

- `UpdateLocationRequest`

### `DELETE /api/v1/locations/{id}`

Purpose:

- delete a location when no resources or tickets still reference it

Access:

- admin only

### `GET /api/v1/resources`

Purpose:

- return the authenticated resource catalog

Query parameters:

- optional `categoryId`
- optional `locationId`
- optional `status`
- optional `minCapacity`
- optional `search`

Response shape:

- collection of `ResourceSummaryResponse`

### `GET /api/v1/resources/{id}`

Purpose:

- fetch one resource with category and location detail

Response shape:

- `ResourceDetailResponse`

### `POST /api/v1/resources`

Purpose:

- create a managed resource

Access:

- admin only

Request shape:

- `CreateResourceRequest`

### `PATCH /api/v1/resources/{id}`

Purpose:

- update a managed resource

Access:

- admin only

Request shape:

- `UpdateResourceRequest`

### `DELETE /api/v1/resources/{id}`

Purpose:

- delete a resource when no bookings or tickets still reference it

Access:

- admin only

### `GET /api/v1/resources/{id}/availability`

Purpose:

- return the full saved availability schedule for a resource

Response shape:

- collection of `ResourceAvailabilityWindowResponse`

### `PUT /api/v1/resources/{id}/availability`

Purpose:

- replace the full availability schedule for a resource atomically

Access:

- admin only

Request shape:

- `ReplaceResourceAvailabilityRequest`

---

## Booking Workflow Endpoints

### `GET /api/v1/bookings`

Purpose:

- return bookings through one role-aware API

Access:

- `STUDENT`: own bookings only
- `ADMIN`: all bookings

Query parameters:

- optional `status`
- optional `resourceId`
- optional `requesterUserId` (admin use)
- optional `bookingDate`

Response shape:

- collection of `BookingSummaryResponse`

### `GET /api/v1/bookings/{id}`

Purpose:

- return one booking detail record

Access:

- `STUDENT`: own bookings only
- `ADMIN`: any booking

Response shape:

- `BookingDetailResponse`

### `POST /api/v1/bookings`

Purpose:

- create a booking request

Access:

- `STUDENT` and `ADMIN`

Key validations:

- valid resource
- valid time range
- no overlapping active booking
- active resource status
- configured availability windows when present

Request shape:

- `CreateBookingRequest`

### `PATCH /api/v1/bookings/{id}/review`

Purpose:

- approve or reject a pending booking

Access:

- admin only

Request shape:

- `ReviewBookingRequest`

### `PATCH /api/v1/bookings/{id}/cancel`

Purpose:

- cancel a pending or approved booking

Access:

- requester or admin

Request shape:

- `CancelBookingRequest`

---

## Planned Ticket Endpoints

### `GET /api/v1/tickets`

Returns:

- collection of `TicketSummaryResponse`

### `POST /api/v1/tickets`

Purpose:

- create a ticket

Key validations:

- valid category
- at least one of resource or location
- no more than 3 attachments
- resource/location consistency when both are supplied

---

## Planned Notification Endpoints

### `GET /api/v1/notifications`

Returns:

- collection of `NotificationSummaryResponse`

### `PATCH /api/v1/notifications/{id}/read`

Purpose:

- mark a notification as read

---

## DTO Contracts

- `CurrentUserResponse`
- `UserSummaryResponse`
- `UserDetailResponse`
- `UpdateUserRequest`
- `UpdateUserRoleRequest`
- `UpdateUserStatusRequest`
- `ResourceCategorySummaryResponse`
- `ResourceCategoryDetailResponse`
- `CreateResourceCategoryRequest`
- `UpdateResourceCategoryRequest`
- `LocationSummaryResponse`
- `LocationDetailResponse`
- `CreateLocationRequest`
- `UpdateLocationRequest`
- `ResourceSummaryResponse`
- `ResourceDetailResponse`
- `CreateResourceRequest`
- `UpdateResourceRequest`
- `ResourceAvailabilityWindowResponse`
- `ReplaceResourceAvailabilityRequest`
- `BookingSummaryResponse`
- `BookingDetailResponse`
- `CreateBookingRequest`
- `ReviewBookingRequest`
- `CancelBookingRequest`
- `TicketSummaryResponse`
- `NotificationSummaryResponse`
