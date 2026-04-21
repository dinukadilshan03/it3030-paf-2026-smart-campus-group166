# SmartCampus Deployment

This document reflects the current hosted SmartCampus setup.

Live frontend: [https://triumphant-warmth-production-14f0.up.railway.app/](https://triumphant-warmth-production-14f0.up.railway.app/)

## Production Topology

- `frontend/` deployed as a Railway web service
- `backend/` deployed as a Railway web service
- Supabase used for PostgreSQL and storage buckets

The frontend is the public entry point. It proxies auth-related and backend routes to the Spring Boot API.

## Backend Railway Service

Service root:

- `backend`

Build command:

```bash
./mvnw -DskipTests package
```

Start command:

```bash
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

Required backend environment variables:

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

Optional backend variables include:

- `GROQ_API_KEY`
- `GROQ_BASE_URL`
- `GEMINI_CHAT_MODEL`
- `TICKETING_ASSISTANT_MODEL`
- `TICKETING_ASSISTANT_BASE_URL`
- `LOCAL_STORAGE_ROOT`

## Frontend Railway Service

Service root:

- `frontend`

Build command:

```bash
npm install
npm run build
```

Start command:

```bash
npm run start
```

Required frontend environment variables:

- `PORT`
- `BACKEND_INTERNAL_URL`
- `NEXT_PUBLIC_API_BASE_URL`

## URL Wiring

Use these rules when updating production:

1. `FRONTEND_URL` on the backend must exactly match the public frontend origin.
2. `BACKEND_INTERNAL_URL` on the frontend should point to the Railway private backend URL.
3. `NEXT_PUBLIC_API_BASE_URL` should point to the backend public HTTPS URL.
4. Google OAuth redirect URI must point to the backend public domain at `/login/oauth2/code/google`.

## Supabase Requirements

Create and keep available:

- database credentials for the selected connection mode
- `resource-images` bucket
- `ticket-attachments` bucket

Supabase is the database and storage layer only. Authentication remains backend-owned.

## Smoke Test Checklist

After deployment or env changes, verify:

1. The live frontend loads.
2. `/login` renders correctly.
3. Student Google sign-in starts and returns to `/auth/callback`.
4. Staff/admin local login succeeds.
5. `GET /api/v1/auth/me` resolves correctly after sign-in.
6. Resources load and admin resource actions still work.
7. Booking creation and review flows work.
8. Ticket creation, assignment, comments, and status changes work.
9. Notifications load for authenticated users.
10. Profile and password-change flows still work.

## Operational Notes

- The backend reads `PORT` with a fallback to `8080`.
- The frontend uses rewrite proxying defined in [frontend/next.config.ts](/C:/Users/dinuka/Documents/SmartCampus/frontend/next.config.ts).
- If OAuth or session redirects fail, first verify `FRONTEND_URL`, `BACKEND_INTERNAL_URL`, and `NEXT_PUBLIC_API_BASE_URL` before debugging application code.
- Keep local and production secrets separate.
