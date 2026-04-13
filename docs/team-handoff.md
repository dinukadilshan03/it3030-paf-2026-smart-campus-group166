# Team Handoff

## Purpose

This is the main handoff note for the current SmartCampus state. It gives the team one place to see:

- what foundation is already implemented
- which modules are ready for frontend work
- what auth and role behavior already exists
- which detailed handoff docs to use next

## Current Project State

The project already has the core backend foundation and the frontend app shell in place.

### Backend already implemented

- auth and session foundation
- user management workflow
- resource workflow
- booking workflow
- ticket workflow

### Frontend already implemented

- login flow and protected shell
- role-based dashboards and navigation
- shared route protection
- admin user-management page
- placeholder routes for resources, bookings, tickets, notifications, and profile

## Auth Model

The auth model is now split by role:

- `STUDENT`
  - Google OAuth only
- `STAFF`
  - local email/password only
- `ADMIN`
  - local email/password only

What is already done:

- session-based backend auth
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/change-password`
- role-aware frontend shell
- forced password-change support for temporary local credentials

## Frontend Role Shell

The app shell and dashboards are already built.

### Student navigation

- dashboard
- resources
- bookings
- tickets
- profile

### Staff navigation

- dashboard
- resources
- tickets
- profile

### Admin navigation

- dashboard
- resources
- bookings
- tickets
- users
- notifications
- profile

The dashboards are scaffolded and role-aware. The `/users` page is no longer a placeholder.

## Completed Module

### Admin users module

The `/users` route is already implemented as a real admin workspace.

Implemented:

- browse/filter/search users
- view user detail
- edit profile fields
- change role
- change status
- create staff/admin users
- create/reset/delete local credentials
- show credential/login state

If teammates need a pattern for how to build an admin workflow page, they should use `/users` as the reference implementation.

Main frontend page:

- [frontend/src/app/(app)/users/page.tsx](C:/Users/dinuka/Documents/SmartCampus/frontend/src/app/(app)/users/page.tsx)

Main frontend feature area:

- [frontend/src/components/users](C:/Users/dinuka/Documents/SmartCampus/frontend/src/components/users)
- [frontend/src/lib/users](C:/Users/dinuka/Documents/SmartCampus/frontend/src/lib/users)

## Workflow Handoff Docs

Use these detailed docs for the remaining frontend feature work:

### Resources

- [docs/resource-component-handoff.md](C:/Users/dinuka/Documents/SmartCampus/docs/resource-component-handoff.md)

### Bookings

- [docs/booking-component-handoff.md](C:/Users/dinuka/Documents/SmartCampus/docs/booking-component-handoff.md)

### Tickets

- [docs/ticket-component-handoff.md](C:/Users/dinuka/Documents/SmartCampus/docs/ticket-component-handoff.md)

## Recommended Team Split

### You

Suggested ownership:

- auth polish
- dashboards
- admin/user management
- project-wide coordination
- notifications later

### Resources teammate

Suggested ownership:

- resource list/browse UI
- category manager
- location manager
- availability editor

### Bookings teammate

Suggested ownership:

- booking request form
- booking list/detail
- admin review flow

### Tickets teammate

Suggested ownership:

- ticket list/detail
- ticket creation
- comments
- assignment/status workflow
- category manager

## What Is Still Not Done

These areas still need implementation:

- real frontend for resources
- real frontend for bookings
- real frontend for tickets
- notifications workflow
- real storage upload flow for attachments
- full profile module polish

## Important Notes For The Team

- do not rebuild auth or route protection
- use the existing backend APIs and frontend shell
- backend already enforces most business rules
- frontend should focus on:
  - list/detail views
  - filters
  - forms
  - dialogs
  - role-aware actions
  - clean display of backend validation errors

## Reference Docs

Main API contract:

- [docs/api/endpoints.md](C:/Users/dinuka/Documents/SmartCampus/docs/api/endpoints.md)

If someone needs to understand the overall app flow before building, start with:

- this file
- the relevant component handoff doc
- the `/users` frontend implementation as a reference pattern

