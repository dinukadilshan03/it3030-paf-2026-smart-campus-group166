# SmartCampus

SmartCampus is a completed full-stack campus operations platform for resource management, bookings, support tickets, notifications, profile management, and admin oversight.

Live app: [https://triumphant-warmth-production-14f0.up.railway.app/](https://triumphant-warmth-production-14f0.up.railway.app/)

## Overview

The project is split into a Next.js frontend and a Spring Boot backend, with Supabase providing PostgreSQL and storage. The application supports three role-aware experiences in one product:

- `STUDENT` for browsing resources, creating bookings, raising tickets, and tracking updates
- `STAFF` for working assigned tickets and adding operational updates
- `ADMIN` for managing users, resources, booking approvals, ticket workflows, notifications, and analytics

## Core Features

- public landing page and authenticated app shell
- role-based navigation and route protection
- Google OAuth for students
- local email/password login for staff and admins
- resource directory with admin CRUD and availability management
- booking request, approval, rejection, and cancellation flows
- ticket creation, assignment, comments, attachments, and lifecycle tracking
- notification center with unread tracking
- admin analytics and AI-assisted resource/ticket workflows where configured
- profile and password-management flows

## Tech Stack

- Frontend: `Next.js 16`, `React 19`, `TypeScript`, `Tailwind CSS 4`
- Backend: `Spring Boot 3.5`, `Java 21`, `Spring Security`, `Spring Data JPA`
- Database: `Supabase PostgreSQL`
- Storage: `Supabase Storage`
- Schema management: `Flyway`
- Hosting: `Railway`

More detail: [docs/tech-stack.md](/C:/Users/dinuka/Documents/SmartCampus/docs/tech-stack.md)

## Project Structure

```text
SmartCampus/
|-- backend/           Spring Boot API, Flyway migrations, auth, business logic
|-- frontend/          Next.js web application
|-- docs/              deployment, workflows, schema, and module reference docs
|-- images/            screenshots and supporting media
|-- legacy-backend/    older backend code retained for reference
|-- legacy-frontend/   older frontend code retained for reference
`-- README.md
```

## Application Areas

- `/login` for staff/admin local login and student Google sign-in entry
- `/dashboard` for the main role-aware landing workspace
- `/resources` for the resource directory and admin resource management
- `/bookings` for booking creation and review workflows
- `/tickets` for support and operations ticketing
- `/notifications` for notification history
- `/users` for admin user management
- `/profile` for self-service account details
- `/analytics` for admin reporting and AI-assisted insights

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Default local URL: `http://localhost:3000`

Frontend env example:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

On Windows:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Default local URL: `http://localhost:8080`

Start from [backend/.env.example](/C:/Users/dinuka/Documents/SmartCampus/backend/.env.example) for backend configuration.

## Environment Summary

Backend requires:

- Supabase database connection settings
- `FRONTEND_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_RESOURCE_IMAGES_BUCKET`
- `SUPABASE_TICKET_ATTACHMENTS_BUCKET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- bootstrap admin credentials
- optional AI provider keys depending on enabled features

Frontend production uses:

- `BACKEND_INTERNAL_URL` for Railway private-network rewrites
- `NEXT_PUBLIC_API_BASE_URL` for browser-visible backend references

## Deployment

Production is hosted on Railway.

- Live frontend: [https://triumphant-warmth-production-14f0.up.railway.app/](https://triumphant-warmth-production-14f0.up.railway.app/)
- Frontend service root: `frontend`
- Backend service root: `backend`
- Database and file storage: Supabase

Full deployment guide: [docs/deployment.md](/C:/Users/dinuka/Documents/SmartCampus/docs/deployment.md)

## Documentation

- [docs/deployment.md](/C:/Users/dinuka/Documents/SmartCampus/docs/deployment.md): production and Railway deployment guidance
- [docs/tech-stack.md](/C:/Users/dinuka/Documents/SmartCampus/docs/tech-stack.md): architecture and stack decisions
- [docs/workflows.md](/C:/Users/dinuka/Documents/SmartCampus/docs/workflows.md): main product workflows and role behavior
- [docs/api/endpoints.md](/C:/Users/dinuka/Documents/SmartCampus/docs/api/endpoints.md): backend API reference
- [docs/entity.md](/C:/Users/dinuka/Documents/SmartCampus/docs/entity.md): entity and schema design notes
- [docs/database/schema.md](/C:/Users/dinuka/Documents/SmartCampus/docs/database/schema.md): schema summary
- [docs/database/relationships.md](/C:/Users/dinuka/Documents/SmartCampus/docs/database/relationships.md): entity relationships
- [docs/team-handoff.md](/C:/Users/dinuka/Documents/SmartCampus/docs/team-handoff.md): current project status and repo orientation
- [docs/resource-component-handoff.md](/C:/Users/dinuka/Documents/SmartCampus/docs/resource-component-handoff.md): resources module reference
- [docs/booking-component-handoff.md](/C:/Users/dinuka/Documents/SmartCampus/docs/booking-component-handoff.md): bookings module reference
- [docs/ticket-component-handoff.md](/C:/Users/dinuka/Documents/SmartCampus/docs/ticket-component-handoff.md): tickets module reference
- [docs/resources-cheat-sheet.md](/C:/Users/dinuka/Documents/SmartCampus/docs/resources-cheat-sheet.md): quick frontend resource module reference

## Notes

- The active application is in `frontend/` and `backend/`.
- The `legacy-*` directories are retained for historical reference and are not the current production app.
- The frontend does not connect directly to Supabase; all business logic and persistence flow through the backend.

## License

This project is licensed under the MIT License. See [LICENSE](/C:/Users/dinuka/Documents/SmartCampus/LICENSE).
