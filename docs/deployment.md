# SmartCampus Deployment

This repo is split into:

- `frontend`: Next.js 16 app
- `backend`: Spring Boot 3.5 / Java 21 API
- Supabase: PostgreSQL + storage buckets

The quickest full deployment is:

- Railway for `frontend`
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
- `FRONTEND_URL=https://<your-frontend-domain>`
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

## 4. Deploy The Frontend On Railway

Create a second Railway service from this repo and configure:

- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Start command: `npm run start`

Set these required environment variables in Railway:

- `PORT`
- `BACKEND_INTERNAL_URL=http://<your-backend-service>.railway.internal:8080`
- `NEXT_PUBLIC_API_BASE_URL=https://<your-backend-domain>`

Redeploy after saving the variable.

Notes:

- `BACKEND_INTERNAL_URL` is used by Next.js rewrites and server-side fetches so the frontend can talk to the backend over Railway's private network.
- `NEXT_PUBLIC_API_BASE_URL` must stay on the backend's public HTTPS URL because browser-visible OAuth and public-origin references still need the public backend address.
- In production, backend API requests are proxied through the frontend's `/backend/...` rewrite while frontend-owned Next app routes stay on `/api/...`.

## 5. Final Wiring

Once both services are live:

1. Confirm the frontend public Railway URL is final.
2. Set backend `FRONTEND_URL` to that exact frontend public URL.
3. Set frontend `BACKEND_INTERNAL_URL` to the backend service's Railway internal URL.
4. Set frontend `NEXT_PUBLIC_API_BASE_URL` to the backend's public Railway URL.
5. Redeploy both services once after the final URLs are in place.

## 6. Smoke Test

Run this sequence after deployment:

1. Open the frontend home page.
2. Confirm login page loads.
3. Confirm Google sign-in starts from the frontend and redirects through the backend successfully.
4. Confirm `/auth/callback` loads and the frontend can resolve `GET /api/v1/auth/me`.
5. Confirm a session cookie is created after login and remains valid on authenticated pages.
6. Test resource listing, filters, and resource analysis pages.
7. Test booking list, create, review, and cancel flows.
8. Test file upload paths that use Supabase storage.
9. Test ticket creation if ticketing is enabled.

## 7. Notes

- The backend now reads `PORT` with a fallback to `8080`, which is required for most hosted Java platforms.
- Backend `FRONTEND_URL` must exactly match the live frontend public URL or OAuth/session redirects will break.
- If the frontend and backend were redeployed under different Railway subdomains, update both services to the current live values before debugging code.
- Keep local and production env values separate.
- Do not store live secrets in `.env.example`.
