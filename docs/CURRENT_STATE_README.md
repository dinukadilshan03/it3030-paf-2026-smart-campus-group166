# SmartCampus Current State README

This file is a fast project-memory document for future coding sessions.
Use it as the first reference before reading the full codebase.

## Purpose

- Capture what is actually implemented right now
- Record the current frontend and backend behavior
- Highlight known gaps so future work does not rediscover them from scratch
- Give LLMs and teammates a quick orientation file to read first

## Project Snapshot

SmartCampus is a university operations platform with these planned modules:

- Module A: Facilities and assets catalogue
- Module B: Booking management
- Module C: Maintenance and incident ticketing
- Module D: Notifications
- Module E: Authentication and authorization

The codebase currently has broader backend module coverage than frontend coverage.
Frontend is strongest in Module E right now.

## Tech Stack

- Frontend: React 19, TypeScript 5.9, Vite 7, React Router 7, plain CSS
- Backend: Java 21, Spring Boot 3.5.x, Spring Security, Spring Data JPA
- Database: PostgreSQL in local/dev config, H2 for tests

## What Is Currently Implemented

### Frontend

Implemented pages and flows:

- `/login`
  - Local email/password login
  - Google OAuth entry button
  - Clear auth error messaging
- `/auth/callback`
  - Finalizes OAuth login on the frontend
  - Refreshes session and redirects by role
- `/app`
  - Authenticated home page for signed-in users
  - Main non-admin landing page
- `/admin/users`
  - Admin-only user management page
  - Create users
  - Filter/search users
  - Edit user profile fields
  - Change role
  - Change status
- `/access-denied`
  - Shown when a signed-in user reaches a route they do not have permission to open

Frontend auth behavior:

- Public routes:
  - `/login`
  - `/auth/callback`
- Protected authenticated route:
  - `/app`
- Protected admin-only route:
  - `/admin/users`
- Root route `/` redirects by session state
  - Not signed in -> `/login`
  - `ADMIN` -> `/admin/users`
  - Other authenticated users -> `/app`
- Role-aware redirect logic is centralized in `frontend/src/auth/authRouting.ts`

### Backend

Implemented backend areas:

- Auth module
  - Session-based local login
  - Session lookup via `/api/auth/me`
  - Logout via `/api/auth/logout`
  - Google OAuth integration
- User management
  - Admin-only CRUD-style user administration endpoints
- Resource module
  - Resource CRUD and search endpoints exist
- Booking module
  - Booking CRUD endpoints exist
  - Popular/recommendation endpoints exist
- Ticket module
  - Ticket CRUD and filtering endpoints exist
- Notifications
  - Notification module structure exists, but frontend usage is not built yet

Backend security behavior:

- Public:
  - `/api/auth/login`
  - `/api/auth/me`
  - `/oauth2/**`
  - `/login/**`
  - `/error`
- Authenticated:
  - `/api/auth/logout`
  - `/api/resources/**`
  - most other API routes by default
- Admin-only:
  - `/api/users/**`

Security response behavior:

- Unauthenticated API access returns `401` with JSON message
- Forbidden API access returns `403` with JSON message
- OAuth success redirects to frontend `/auth/callback`
- OAuth failure redirects to frontend `/login?error=oauth`
- Auth and user management now use concrete services in `modules/auth/service` without a separate `impl` layer

## Module E Status

Module E is the most complete end-to-end part of the system right now.

Implemented Module E capabilities:

- Local login for bootstrap/admin usage
- Google OAuth login integration
- Session restore on page load
- Role-aware frontend redirects
- Protected frontend routes
- Admin-only frontend route guard
- Clear access-denied page
- Admin user management UI
- Backend route protection for admin user endpoints

Supported roles in code:

- `ADMIN`
- `USER`
- `TECHNICIAN`

For assignment/demo purposes, the required roles are primarily:

- `ADMIN`
- `USER`

## Bootstrap Credentials and Config

Backend config source:

- `backend/src/main/resources/application.properties`

Default bootstrap admin values:

- Email: `admin@smartcampus.local`
- Password: `Admin@12345`

Relevant backend env/config keys:

- `DB_URL`
- `DB_USER`
- `DB_PASSWORD`
- `FRONTEND_URL`
- `BOOTSTRAP_ADMIN_NAME`
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Key Files To Read First

If someone needs deeper context after this file, start here:

- Frontend app routing: `frontend/src/App.tsx`
- Frontend auth state: `frontend/src/auth/AuthContext.tsx`
- Frontend route guard: `frontend/src/components/ProtectedRoute.tsx`
- Frontend login page: `frontend/src/pages/LoginPage.tsx`
- Frontend admin users page: `frontend/src/pages/AdminUsersPage.tsx`
- Backend security config: `backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java`
- Backend OAuth redirect handler: `backend/src/main/java/com/smartcampus/backend/config/OAuth2LoginSuccessHandler.java`
- Backend auth controller: `backend/src/main/java/com/smartcampus/backend/modules/auth/controller/AuthController.java`
- Backend user controller: `backend/src/main/java/com/smartcampus/backend/modules/auth/controller/UserController.java`

## Known Gaps

- Frontend does not yet expose booking, resource, ticket, or notification product screens
- Backend security is strongest around auth and user-management; broader module-by-module authorization can still be refined
- Notifications do not yet have a visible frontend experience
- There is no fully built shared campus dashboard yet beyond the authenticated home placeholder
- API response shapes are not fully standardized across all modules

## Suggested Session Workflow

For future LLM sessions:

1. Read this file first
2. If working on auth/routing, then read the Module E key files listed above
3. Only inspect the rest of the project when the task requires deeper domain context

## Maintenance Rule

Update this file whenever one of these changes:

- New frontend page or route is added
- Security rules or roles change
- New module becomes actively usable in the frontend
- OAuth/auth/session behavior changes
- Important setup or bootstrap defaults change

Keep this file short, factual, and implementation-oriented.
