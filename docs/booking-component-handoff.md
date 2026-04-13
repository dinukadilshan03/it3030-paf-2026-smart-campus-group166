# Booking Component Handoff

## Scope

This module is the booking workflow. The backend is implemented and role-aware. The frontend route is still a placeholder and needs the actual student/admin experience built on top of the existing APIs.

Route to replace:

- [frontend/src/app/(app)/bookings/page.tsx](C:/Users/dinuka/Documents/SmartCampus/frontend/src/app/(app)/bookings/page.tsx)

Relevant backend module:

- [backend/src/main/java/com/smartcampus/backend/modules/booking](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/booking)

## What Is Already Done

### Backend coverage

Implemented backend areas:

- booking creation
- role-aware booking list
- booking detail
- admin review
- requester/admin cancellation

Main backend files:

- [BookingController.java](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/booking/controller/BookingController.java)
- [BookingService.java](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/booking/service/BookingService.java)
- [BookingRepository.java](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/booking/repository/BookingRepository.java)
- [BookingMapper.java](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/booking/mapper/BookingMapper.java)

### Access model

- `STUDENT`
  - can create bookings
  - can view only own bookings
  - can cancel own pending/approved bookings
- `ADMIN`
  - can create bookings for self
  - can view all bookings
  - can review pending bookings
  - can cancel bookings
- `STAFF`
  - not part of booking workflow in v1

### Business rules already enforced in backend

- resource must exist
- resource must be active/bookable
- booking date/time must be valid
- expected attendees must be positive when provided
- overlapping active bookings are blocked
- `REJECTED` and `CANCELLED` bookings do not block new requests
- resource availability windows are enforced when configured
- if a resource has no availability windows, it is treated as open by default
- resources with `requiresApproval = true` create `PENDING` bookings
- resources with `requiresApproval = false` auto-create `APPROVED` bookings
- admin approval re-checks conflicts and availability before approving

## APIs You Should Use

- `GET /api/v1/bookings`
- `GET /api/v1/bookings/{id}`
- `POST /api/v1/bookings`
- `PATCH /api/v1/bookings/{id}/review`
- `PATCH /api/v1/bookings/{id}/cancel`

### List filter support

Admin list supports:

- `status`
- `resourceId`
- `requesterUserId`
- `bookingDate`

### Main DTOs

- `BookingSummaryResponse`
- `BookingDetailResponse`
- `CreateBookingRequest`
- `ReviewBookingRequest`
- `CancelBookingRequest`
- `BookingReviewDecision`

## What The Frontend Should Build

Recommended split of UX:

### Student side

- create booking request flow
- my bookings list
- booking detail view
- cancel action when allowed

### Admin side

- booking management page
- filters for all bookings
- pending review queue behavior
- approve/reject actions
- cancel action

## Recommended UI Sections

1. Booking request form
- resource selector
- date
- start time
- end time
- purpose/notes if exposed by DTO
- expected attendees if exposed by DTO

2. Booking list
- status badge
- resource summary
- date and time
- requester summary for admin

3. Booking detail
- full booking information
- current status
- review metadata
- cancellation metadata

4. Admin review controls
- approve
- reject with reason

## Suggested Frontend File Layout

Suggested new frontend area:

- `frontend/src/components/bookings`
- `frontend/src/lib/bookings`

Suggested files:

- `BookingPage.tsx`
- `BookingFilters.tsx`
- `BookingList.tsx`
- `BookingDetailPanel.tsx`
- `CreateBookingForm.tsx`
- `ReviewBookingDialog.tsx`
- `CancelBookingDialog.tsx`
- `frontend/src/lib/bookings/api.ts`
- `frontend/src/lib/bookings/types.ts`

## Important UX Guidance

- do not try to recreate overlap or availability rules fully in frontend
- backend is the source of truth for scheduling validation
- frontend should show clean input UX and surface backend validation messages
- admin and student can share the same route, but render different controls based on role

## Suggested First Milestone

Build this first:

1. student booking request form
2. booking list for current user/admin
3. booking detail drawer or panel

After that, add:

1. admin filters
2. review approve/reject flow
3. cancel flow

## Practical Notes

- bookings already depend on the resource backend being complete
- use the resources API to populate resource selectors if needed
- there is no notification implementation yet, so do not wait for notification UX
- use the `/users` page pattern for list/detail/mutation refresh logic if helpful

