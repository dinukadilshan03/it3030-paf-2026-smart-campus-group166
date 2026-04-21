# SmartCampus Frontend

This is the production frontend for SmartCampus. It is a `Next.js 16` App Router application that serves the public landing page, authentication flows, and the protected campus operations workspace.

Live app: [https://triumphant-warmth-production-14f0.up.railway.app/](https://triumphant-warmth-production-14f0.up.railway.app/)

## Stack

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`

## Scripts

```bash
npm install
npm run dev
npm run build
npm run start
npm run lint
```

## Environment

Local example:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Production variables:

- `BACKEND_INTERNAL_URL` for Railway internal-network rewrites
- `NEXT_PUBLIC_API_BASE_URL` for browser-visible backend references

## Routing Layout

- `src/app/(public)` contains login, OAuth callback, and password-change flows
- `src/app/(app)` contains the authenticated workspace
- `src/app/api` contains frontend-owned API routes and server actions where used

Primary workspace routes:

- `/dashboard`
- `/resources`
- `/bookings`
- `/tickets`
- `/notifications`
- `/users`
- `/profile`
- `/analytics`

## Backend Integration

The frontend talks to the Spring Boot backend through:

- direct public API calls using `NEXT_PUBLIC_API_BASE_URL`
- Railway rewrite proxying for `/backend/*`, `/oauth2/*`, `/login/oauth2/*`, and `/error`

See [next.config.ts](/C:/Users/dinuka/Documents/SmartCampus/frontend/next.config.ts).

## Frontend Structure

- `src/components` for feature UI
- `src/lib` for API clients, feature logic, auth helpers, and config
- `src/types` for shared frontend types
- `public` for static assets

Feature areas currently represented in the codebase:

- auth
- dashboard
- resources
- bookings
- tickets
- notifications
- profile
- users
- admin analytics

## Development Notes

- The frontend is role-aware and expects backend session state from `/api/v1/auth/me`.
- Students authenticate through Google OAuth.
- Staff and admins authenticate through local email/password.
- Do not connect the frontend directly to Supabase; the backend is the single source of truth for data access and validation.

Repo-level documentation lives in [README.md](/C:/Users/dinuka/Documents/SmartCampus/README.md).
