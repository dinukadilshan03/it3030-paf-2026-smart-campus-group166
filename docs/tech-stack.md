# Tech Stack

## Current Stack

SmartCampus is a split frontend/backend application with backend-owned data access and business rules.

## Frontend

- Framework: `Next.js 16` with App Router
- UI runtime: `React 19`
- Language: `TypeScript`
- Styling: `Tailwind CSS 4`
- Deployment target: Railway

Frontend responsibilities:

- render the public marketing and authentication flows
- render the protected role-aware workspace
- fetch backend APIs
- proxy backend auth and API traffic where needed through rewrites
- reflect backend authorization in navigation and UI affordances

## Backend

- Framework: `Spring Boot 3.5.13`
- Language: `Java 21`
- Build tool: Maven Wrapper
- Security: Spring Security + OAuth2 client
- Persistence: Spring Data JPA
- Validation: Spring Validation
- Schema migration: Flyway
- Deployment target: Railway

Backend responsibilities:

- authentication and session management
- Google OAuth handling for students
- local auth for staff and admins
- authorization and role enforcement
- business rules for resources, bookings, tickets, notifications, analytics, and users
- file-storage coordination
- REST API delivery

## Database and Storage

- Database: Supabase PostgreSQL
- Storage: Supabase Storage
- Connection modes: `pooler` or `direct`

Important boundary:

- the frontend does not connect to Supabase directly
- the backend is the only application layer that mutates or reads core data
- schema changes should flow through Flyway migrations

## AI and Integrations

Configured integrations in the active backend include:

- Google Gemini via Spring AI
- optional Groq-backed analytics settings
- ticketing assistant API settings

These features are environment-driven and can be enabled or disabled without changing the frontend deployment model.

## Authentication Model

- `STUDENT`: Google OAuth only
- `STAFF`: local email/password only
- `ADMIN`: local email/password only

Session state is backend-owned and consumed by the frontend through authenticated API calls.

## Hosting Model

- public web app hosted on Railway
- backend API hosted on Railway
- database and file storage hosted on Supabase

Live frontend URL:

- [https://triumphant-warmth-production-14f0.up.railway.app/](https://triumphant-warmth-production-14f0.up.railway.app/)
