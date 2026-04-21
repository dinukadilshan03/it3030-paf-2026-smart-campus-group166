# Project Orientation

This document is the quick orientation guide for the current SmartCampus codebase.

## Current State

SmartCampus is no longer a scaffold or partial handoff. The active web app is implemented in:

- [frontend](/C:/Users/dinuka/Documents/SmartCampus/frontend)
- [backend](/C:/Users/dinuka/Documents/SmartCampus/backend)

Live deployment:

- [https://triumphant-warmth-production-14f0.up.railway.app/](https://triumphant-warmth-production-14f0.up.railway.app/)

Legacy directories remain in the repo for reference only:

- `legacy-frontend`
- `legacy-backend`

## Where To Start

If you are new to the repo, read in this order:

1. [README.md](/C:/Users/dinuka/Documents/SmartCampus/README.md)
2. [docs/tech-stack.md](/C:/Users/dinuka/Documents/SmartCampus/docs/tech-stack.md)
3. [docs/deployment.md](/C:/Users/dinuka/Documents/SmartCampus/docs/deployment.md)
4. [docs/workflows.md](/C:/Users/dinuka/Documents/SmartCampus/docs/workflows.md)
5. relevant module reference docs in `docs/`

## Active Product Areas

- authentication and password-change flows
- dashboard
- resources
- bookings
- tickets
- notifications
- users
- profile
- analytics

## Repo Responsibilities

### Frontend

Use [frontend](/C:/Users/dinuka/Documents/SmartCampus/frontend) for:

- public pages
- app routes
- UI components
- frontend API clients
- route-level role-aware experiences

### Backend

Use [backend](/C:/Users/dinuka/Documents/SmartCampus/backend) for:

- REST API controllers
- business logic
- security
- database access
- Flyway migrations
- storage integration

## Important Constraints

- the backend is the source of truth for validation and permissions
- the frontend should not connect directly to Supabase
- production deployment is Railway plus Supabase
- student auth is Google OAuth only
- staff/admin auth is local credentials only

## Reference Docs

- [docs/api/endpoints.md](/C:/Users/dinuka/Documents/SmartCampus/docs/api/endpoints.md)
- [docs/entity.md](/C:/Users/dinuka/Documents/SmartCampus/docs/entity.md)
- [docs/database/schema.md](/C:/Users/dinuka/Documents/SmartCampus/docs/database/schema.md)
- [docs/database/relationships.md](/C:/Users/dinuka/Documents/SmartCampus/docs/database/relationships.md)
- [docs/resource-component-handoff.md](/C:/Users/dinuka/Documents/SmartCampus/docs/resource-component-handoff.md)
- [docs/booking-component-handoff.md](/C:/Users/dinuka/Documents/SmartCampus/docs/booking-component-handoff.md)
- [docs/ticket-component-handoff.md](/C:/Users/dinuka/Documents/SmartCampus/docs/ticket-component-handoff.md)
