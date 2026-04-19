# SmartCampus

SmartCampus is a full-stack campus operations platform that brings resource management, booking workflows, support ticketing, notifications, analytics, and user administration into one system. It is built for three core audiences in the same product surface: students, staff, and admins.

The project combines a modern Next.js frontend with a Spring Boot backend, using Supabase for PostgreSQL and file storage. The result is a role-aware platform for managing day-to-day campus operations with a cleaner workflow than scattered spreadsheets, email chains, and disconnected tools.

## Table of Contents

- [Project Overview](#project-overview)
- [Problem and Solution](#problem-and-solution)
- [Visual Showcase](#visual-showcase)
- [Key Features](#key-features)
- [Technical Components](#technical-components)
- [Product Modules](#product-modules)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [API Overview](#api-overview)
- [Local Development Setup](#local-development-setup)
- [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)
- [CI and Quality Checks](#ci-and-quality-checks)
- [Further Documentation](#further-documentation)
- [License](#license)

## Project Overview

SmartCampus centralizes core campus workflows that are often handled in separate systems:

- resource cataloging and availability management
- student booking requests and admin reviews
- support ticket creation, assignment, and resolution workflows
- notifications for important updates
- role-based dashboards and analytics
- admin-led user and credential management

The active application lives in the `frontend` and `backend` directories. The README below documents that current implementation only.

## Problem and Solution

Campus teams often manage facilities, requests, and support issues across disconnected tools. That creates delays, duplicate records, unclear ownership, and poor visibility across students, staff, and administrators.

SmartCampus solves that by giving the campus one shared platform where:

- students can discover resources, request bookings, raise issues, and follow updates
- staff can work on operational tickets from a focused workspace
- admins can manage users, resources, approvals, ticket assignments, and oversight dashboards

## Visual Showcase

![SmartCampus homepage](images/homepage.png)

## Key Features

- Role-based experience for `STUDENT`, `STAFF`, and `ADMIN`
- Public landing page plus protected app shell
- Resource browsing, management, availability windows, and AI-assisted discovery
- Booking request, approval, rejection, and cancellation workflows
- Ticket reporting, comments, assignment tracking, status changes, attachments, and reporting
- Notification center with unread counts and bulk-read actions
- Admin analytics dashboards and AI-assisted insights where enabled
- Admin user management with local credential creation and password reset flows
- Session-based authentication with Google OAuth for students and local login for staff/admins

## Technical Components

### Frontend

The frontend is a `Next.js 16` application using the App Router, `React 19`, `TypeScript`, and `Tailwind CSS`.

Responsibilities:

- render the public marketing page and protected application shell
- enforce role-aware navigation and route access on the client side
- call backend APIs for resources, bookings, tickets, notifications, profile, analytics, and users
- provide role-specific dashboards and workspace pages

Notable frontend surfaces:

- public landing page and login flow
- dashboard
- resources
- bookings
- tickets
- notifications
- users
- profile

### Backend

The backend is a `Spring Boot 3.5` application running on `Java 21`.

Responsibilities:

- expose RESTful JSON APIs
- own business logic and validation
- enforce authentication and authorization
- manage session state and OAuth callbacks
- handle persistence through Spring Data JPA
- apply schema changes through Flyway migrations
- coordinate storage access for resource images and ticket attachments

Backend modules include:

- auth
- user
- resource
- booking
- ticket
- notification
- profile
- admin analytics
- AI services

### Database and Storage

SmartCampus uses Supabase for both the database and storage layers.

- Database: Supabase PostgreSQL
- File storage: Supabase Storage
- Schema ownership: Flyway migrations in the backend
- Storage use cases:
  - resource images
  - ticket attachment files

The backend is the only application layer that talks directly to the database. The frontend consumes backend DTOs and API responses only.

### Authentication and Authorization

The authentication model is split by role:

- `STUDENT`: Google OAuth only
- `STAFF`: local email/password only
- `ADMIN`: local email/password only

Authorization is role-based and enforced in the backend, with the frontend mirroring access rules in navigation and route handling.

Key auth behaviors:

- current user endpoint for session-aware UI bootstrapping
- forced password-change flow for temporary local credentials
- role-restricted module access
- backend-controlled session invalidation on logout

### Deployment and Infrastructure

The recommended production topology for this repo is:

- `frontend` deployed on Railway
- `backend` deployed on Railway
- Supabase used for PostgreSQL and storage buckets

This keeps the UI, API, database, and file storage clearly separated while still being straightforward to deploy and maintain for a student or team project.

## Product Modules

### Resources

The resources module supports campus facilities and asset management.

Capabilities:

- browse resource catalog entries
- filter by category, location, and search terms
- create, edit, and delete resources as an admin
- manage categories and locations
- manage availability windows
- use AI-assisted recommendations and analysis features where configured

### Bookings

The bookings module handles reservation workflows.

Capabilities:

- create booking requests for eligible users
- review booking details
- approve or reject requests as an admin
- cancel bookings when needed
- track booking state over time

### Tickets

The ticketing module supports incident reporting and operational follow-up.

Capabilities:

- create tickets
- browse ticket lists and details
- comment on tickets
- assign tickets to staff
- update ticket status through its lifecycle
- attach files
- request reconsideration where supported
- generate and access ticket reports

### Analytics

The analytics area gives admins operational visibility.

Capabilities:

- overview dashboards
- usage and operational trend views
- AI-assisted insights and follow-up prompts where configured
- quick access to administrative action areas

### Users

The users module is an admin-only management workspace.

Capabilities:

- browse, search, and filter users
- view detailed user records
- create staff and admin accounts
- change user roles and statuses
- create local credentials
- reset temporary passwords
- remove local login access without deleting the user

### Notifications

The notifications module keeps users updated on booking and ticket activity.

Capabilities:

- list notifications
- show unread counts
- mark individual notifications as read
- mark all notifications as read

### Profile

The profile module gives authenticated users access to their own account details.

Capabilities:

- fetch current profile data
- view and update supported profile fields

## Project Structure

```text
SmartCampus/
├── backend/          Spring Boot API, Flyway migrations, auth, business logic
├── frontend/         Next.js application, dashboards, module workspaces
├── docs/             API, schema, deployment, workflow, and handoff documentation
├── images/           Project screenshots and media assets
├── .github/          CI workflow configuration
└── LICENSE
```

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- ESLint 9
- `lucide-react`

### Backend

- Spring Boot 3.5
- Java 21
- Spring Web
- Spring Data JPA
- Spring Security
- Spring OAuth2 Client
- Spring Validation
- Flyway
- PostgreSQL JDBC driver
- Lombok
- PDFBox
- Spring AI with Google GenAI starter

### Platform Services

- Supabase PostgreSQL
- Supabase Storage
- Railway
- Google OAuth 2.0

## API Overview

The backend exposes RESTful JSON APIs under `/api/v1`.

Primary API areas:

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/resources`
- `/api/v1/resource-categories`
- `/api/v1/locations`
- `/api/v1/bookings`
- `/api/v1/tickets`
- `/api/v1/notifications`
- `/api/v1/profile`
- `/api/v1/health`

For the detailed endpoint contract, see [docs/api/endpoints.md](docs/api/endpoints.md).

## Local Development Setup

### Prerequisites

Make sure you have:

- Node.js 20 or newer
- npm
- Java 21
- a Supabase project with PostgreSQL access
- Supabase storage buckets
- Google OAuth credentials

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd SmartCampus
```

### 2. Configure backend environment variables

Create a local backend env file from the example:

```bash
cp backend/.env.example backend/.env
```

Then update `backend/.env` with your real Supabase, Google OAuth, bootstrap admin, and optional AI values.

### 3. Configure frontend environment variables

Create a local frontend env file from the example:

```bash
cp frontend/.env.local.example frontend/.env.local
```

Set the backend base URL for local development:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### 4. Start the backend

```bash
cd backend
./mvnw spring-boot:run
```

The backend runs on `http://localhost:8080` by default.

### 5. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` by default.

### 6. Local sign-in flow notes

- Student Google OAuth callback should point to `http://localhost:8080/login/oauth2/code/google`
- Backend `FRONTEND_URL` should be `http://localhost:3000`
- Frontend `NEXT_PUBLIC_API_BASE_URL` should be `http://localhost:8080`

## Environment Configuration

### Backend environment variables

The backend supports Supabase-only database connectivity and reads env values from `backend/.env`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DB_CONNECTION_MODE` | Yes | Supabase connection mode: `pooler` or `direct` |
| `DB_URL_POOLER` | Yes | Supabase pooler JDBC URL |
| `DB_URL_DIRECT` | Yes | Supabase direct JDBC URL |
| `DB_USER_POOLER` | Yes | Supabase pooler DB username |
| `DB_USER_DIRECT` | Yes | Supabase direct DB username |
| `DB_PASSWORD` | Yes | Supabase database password |
| `DB_MAX_POOL_SIZE` | No | Hikari max pool size |
| `DB_MIN_IDLE` | No | Hikari min idle connections |
| `DB_CONNECTION_TIMEOUT_MS` | No | Connection timeout |
| `FRONTEND_URL` | Yes | Frontend origin used for redirects and auth flow |
| `BOOTSTRAP_ADMIN_EMAIL` | Yes | Bootstrap admin email |
| `BOOTSTRAP_ADMIN_TEMP_PASSWORD` | Yes | Bootstrap admin temporary password |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `SUPABASE_RESOURCE_IMAGES_BUCKET` | Yes | Bucket name for resource images |
| `SUPABASE_TICKET_ATTACHMENTS_BUCKET` | Yes | Bucket name for ticket attachments |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `LOCAL_AUTH_MAX_FAILED_ATTEMPTS` | No | Max failed local login attempts |
| `LOCAL_AUTH_LOCK_DURATION_MINUTES` | No | Local auth lock duration |
| `ANALYTICS_TIMEZONE` | No | Analytics timezone |
| `ANALYTICS_AI_ENABLED` | No | Enable analytics AI features |
| `ANALYTICS_AI_PROVIDER` | No | Analytics AI provider |
| `ANALYTICS_AI_MODEL` | No | Analytics AI model |
| `ANALYTICS_AI_TIMEOUT_MS` | No | Analytics AI timeout |
| `GEMINI_API_KEY` | No | Google GenAI key |
| `SPRING_AI_CHAT_MODEL` | No | Spring AI chat model provider |
| `GROQ_API_KEY` | No | Groq API key when used |
| `GROQ_BASE_URL` | No | Groq-compatible base URL override |
| `GEMINI_CHAT_MODEL` | No | Gemini chat model override |
| `Ticketing_API_KEY` | No | Ticket assistant API key |
| `TICKETING_ASSISTANT_MODEL` | No | Ticket assistant model |
| `TICKETING_ASSISTANT_BASE_URL` | No | Ticket assistant base URL |
| `LOCAL_STORAGE_ROOT` | No | Local storage root fallback |

### Frontend environment variables

The frontend local example currently defines:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Public base URL of the backend API |

Production deployments also use:

| Variable | Required | Purpose |
| --- | --- | --- |
| `BACKEND_INTERNAL_URL` | Yes | Railway internal backend URL for server-side rewrites and fetches |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Public HTTPS backend URL used by browser-visible flows |

### Supabase connection modes

SmartCampus supports two connection modes for the backend:

- `pooler`: recommended default for most setups and shared environments
- `direct`: use when pooler connectivity times out or fails on your machine

If you cannot connect in `pooler` mode locally, switch `DB_CONNECTION_MODE=direct` and use the direct Supabase JDBC endpoint instead.

## Deployment

SmartCampus is designed to deploy cleanly with:

- Railway for the frontend
- Railway for the backend
- Supabase for PostgreSQL and storage

For the full deployment reference, see [docs/deployment.md](docs/deployment.md).

### Recommended production topology

- `frontend` service: Railway
- `backend` service: Railway
- database: Supabase PostgreSQL
- storage: Supabase Storage

### Production environment variables by component

#### Backend

Required production backend values include:

- `PORT`
- `FRONTEND_URL`
- `DB_CONNECTION_MODE`
- `DB_URL_POOLER`
- `DB_URL_DIRECT`
- `DB_USER_POOLER`
- `DB_USER_DIRECT`
- `DB_PASSWORD`
- `DB_MAX_POOL_SIZE`
- `DB_MIN_IDLE`
- `DB_CONNECTION_TIMEOUT_MS`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_RESOURCE_IMAGES_BUCKET`
- `SUPABASE_TICKET_ATTACHMENTS_BUCKET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_TEMP_PASSWORD`
- `LOCAL_AUTH_MAX_FAILED_ATTEMPTS`
- `LOCAL_AUTH_LOCK_DURATION_MINUTES`
- `ANALYTICS_TIMEZONE`
- `ANALYTICS_AI_ENABLED`
- `ANALYTICS_AI_PROVIDER`
- `ANALYTICS_AI_MODEL`
- `ANALYTICS_AI_TIMEOUT_MS`
- `GEMINI_API_KEY`
- `SPRING_AI_CHAT_MODEL`
- `Ticketing_API_KEY`

Optional production backend values include:

- `GROQ_API_KEY`
- `GROQ_BASE_URL`
- `GEMINI_CHAT_MODEL`
- `TICKETING_ASSISTANT_MODEL`
- `TICKETING_ASSISTANT_BASE_URL`
- `LOCAL_STORAGE_ROOT`

#### Frontend

Required production frontend values include:

- `PORT`
- `BACKEND_INTERNAL_URL`
- `NEXT_PUBLIC_API_BASE_URL`

### Deployment flow

#### 1. Prepare Supabase

- create a Supabase project
- collect database connection credentials
- create storage buckets:
  - `resource-images`
  - `ticket-attachments`

#### 2. Deploy the backend

Configure Railway for the `backend` directory:

- root directory: `backend`
- build command: `./mvnw -DskipTests package`
- start command: `java -jar target/backend-0.0.1-SNAPSHOT.jar`

After deploy, verify:

- `https://<your-backend-domain>/api/v1/health`
- `https://<your-backend-domain>/actuator/health`

#### 3. Configure Google OAuth

In Google Cloud Console, add the backend callback URI:

```text
https://<your-backend-domain>/login/oauth2/code/google
```

Also make sure the backend domain is allowed anywhere your Google app requires an authorized origin.

#### 4. Deploy the frontend

Configure Railway for the `frontend` directory:

- root directory: `frontend`
- build command: `npm install && npm run build`
- start command: `npm run start`

#### 5. Wire final frontend and backend URLs

Once both services are live:

1. set backend `FRONTEND_URL` to the final frontend public URL
2. set frontend `BACKEND_INTERNAL_URL` to the backend Railway internal URL
3. set frontend `NEXT_PUBLIC_API_BASE_URL` to the backend public HTTPS URL
4. redeploy both services after saving final values

#### 6. Run production smoke tests

Verify:

- landing page loads
- login page loads
- Google sign-in redirects successfully
- `/auth/callback` completes properly
- current user resolution works through `GET /api/v1/auth/me`
- resource pages load
- booking list and booking actions work
- ticket list and ticket actions work
- uploads to storage-backed flows work
- authenticated pages retain a valid session

### Production verification checklist

- backend health endpoint returns successfully
- actuator health endpoint returns successfully
- frontend can reach backend APIs
- OAuth redirects return to the correct frontend
- session cookies behave correctly after login
- booking workflow works end to end
- ticket workflow works end to end
- notifications load for authenticated users

## CI and Quality Checks

GitHub Actions is configured in `.github/workflows/ci.yml`.

Current CI behavior:

- backend job
  - sets up Java 21
  - runs `./mvnw -B clean package -DskipTests`
- frontend job
  - sets up Node.js 20
  - runs `npm ci`
  - runs `npm run build`

Recommended local checks before pushing:

```bash
cd backend
./mvnw test
```

```bash
cd frontend
npm install
npm run build
```

## Further Documentation

- [API endpoints](docs/api/endpoints.md)
- [Deployment guide](docs/deployment.md)
- [Tech stack](docs/tech-stack.md)
- [Database schema](docs/database/schema.md)
- [System workflows](docs/workflows.md)

## License

This project is licensed under the [MIT License](LICENSE).
