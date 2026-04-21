# Bookings Module Reference

This document describes the current booking implementation.

## Scope

The bookings area covers:

- booking creation
- role-aware booking lists
- booking detail views
- admin review actions
- cancellation flows

## Frontend Areas

- [frontend/src/app/(app)/bookings/page.tsx](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/app/(app)/bookings/page.tsx)
- [frontend/src/components/bookings](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/components/bookings)
- [frontend/src/lib/bookings](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/lib/bookings)

## Backend Areas

- [backend/src/main/java/com/smartcampus/backend/modules/booking](/C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/booking)

## Access Model

- `STUDENT` can create bookings, view own bookings, and cancel allowed bookings
- `ADMIN` can view all bookings, review pending bookings, and cancel bookings
- `STAFF` is not part of booking workflows in the current version

## Main Endpoints

- `GET /api/v1/bookings`
- `GET /api/v1/bookings/{id}`
- `POST /api/v1/bookings`
- `PATCH /api/v1/bookings/{id}/review`
- `PATCH /api/v1/bookings/{id}/cancel`

Admin list filters:

- `status`
- `resourceId`
- `requesterUserId`
- `bookingDate`

## Key Backend Rules

- the resource must exist and be bookable
- date and time ranges must be valid
- overlapping active bookings are blocked
- `REJECTED` and `CANCELLED` bookings do not block new bookings
- configured availability windows are enforced
- resources without availability windows are treated as open by default
- approval behavior depends on `requiresApproval`
- admin approval rechecks conflicts before finalizing approval

## Notes For Contributors

- do not duplicate scheduling logic in the frontend
- show backend validation responses directly when a booking cannot be created or reviewed
- keep student and admin differences in the UI, but rely on backend authorization for enforcement
