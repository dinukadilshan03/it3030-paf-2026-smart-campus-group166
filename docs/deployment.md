# SmartCampus Deployment

This repo is split into:

- `frontend`: Next.js 16 app
- `backend`: Spring Boot 3.5 / Java 21 API
- Supabase: PostgreSQL + storage buckets

The quickest full deployment is:

- Vercel for `frontend`
- Railway for `backend`
- Supabase for database and file storage

## 1. Prerequisites

Prepare these production values before deploying:

- Supabase database connection details
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_RESOURCE_IMAGES_BUCKET`
- `SUPABASE_TICKET_ATTACHMENTS_BUCKET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_TEMP_PASSWORD`
- `GEMINI_API_KEY` if AI parsing is enabled
- `Ticketing_API_KEY` if ticket assistant is enabled

Create the Supabase buckets if they do not already exist:

- `resource-images`
- `ticket-attachments`

## 2. Deploy The Backend On Railway

Create a new Railway project from this repo and configure:

- Root directory: `backend`
- Build command: `./mvnw -DskipTests package`
- Start command: `java -jar target/backend-0.0.1-SNAPSHOT.jar`

Set these environment variables in Railway:

- `PORT`
- `FRONTEND_URL=https://<your-vercel-domain>`
- `DB_CONNECTION_MODE=pooler`
- `DB_URL_POOLER=jdbc:postgresql://...`
- `DB_URL_DIRECT=jdbc:postgresql://...`
- `DB_USER_POOLER=...`
- `DB_USER_DIRECT=...`
- `DB_PASSWORD=...`
- `DB_MAX_POOL_SIZE=5`
- `DB_MIN_IDLE=1`
- `DB_CONNECTION_TIMEOUT_MS=30000`
- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `SUPABASE_RESOURCE_IMAGES_BUCKET=resource-images`
- `SUPABASE_TICKET_ATTACHMENTS_BUCKET=ticket-attachments`
- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`
- `BOOTSTRAP_ADMIN_EMAIL=...`
- `BOOTSTRAP_ADMIN_TEMP_PASSWORD=...`
- `LOCAL_AUTH_MAX_FAILED_ATTEMPTS=5`
- `LOCAL_AUTH_LOCK_DURATION_MINUTES=15`
- `ANALYTICS_TIMEZONE=Asia/Colombo`
- `ANALYTICS_AI_ENABLED=true`
- `ANALYTICS_AI_PROVIDER=groq`
- `ANALYTICS_AI_MODEL=llama-3.1-8b-instant`
- `ANALYTICS_AI_TIMEOUT_MS=8000`
- `GEMINI_API_KEY=...`
- `SPRING_AI_CHAT_MODEL=google-genai`
- `Ticketing_API_KEY=...`

Optional:

- `GROQ_API_KEY`
- `GROQ_BASE_URL`
- `GEMINI_CHAT_MODEL`
- `TICKETING_ASSISTANT_MODEL`
- `TICKETING_ASSISTANT_BASE_URL`
- `LOCAL_STORAGE_ROOT`

After deploy, verify:

- `https://<your-backend-domain>/api/v1/health`
- `https://<your-backend-domain>/actuator/health`

## 3. Configure Google OAuth

In Google Cloud Console, update the production redirect URI:

- `https://<your-backend-domain>/login/oauth2/code/google`

Also add the production backend domain to authorized origins if your Google app configuration requires it.

## 4. Deploy The Frontend On Vercel

Create a Vercel project from this repo and configure:

- Root directory: `frontend`
- Framework preset: Next.js

Set this required environment variable in Vercel:

- `NEXT_PUBLIC_API_BASE_URL=https://<your-backend-domain>`

Redeploy after saving the variable.

## 5. Final Wiring

Once both services are live:

1. Set Railway `FRONTEND_URL` to the final Vercel URL.
2. Set Vercel `NEXT_PUBLIC_API_BASE_URL` to the final Railway URL.
3. Redeploy both services once after the final URLs are in place.

## 6. Smoke Test

Run this sequence after deployment:

1. Open the frontend home page.
2. Confirm login page loads.
3. Test `GET /api/v1/health`.
4. Test Google sign-in redirect.
5. Confirm a session cookie is created after login.
6. Test resource listing and booking flows.
7. Test file upload paths that use Supabase storage.
8. Test ticket creation if ticketing is enabled.

## 7. Notes

- The backend now reads `PORT` with a fallback to `8080`, which is required for most hosted Java platforms.
- Keep local and production env values separate.
- Do not store live secrets in `.env.example`.
