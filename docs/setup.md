# Smart Campus Project - Setup Guide

This guide explains how to set up the project locally for both backend and frontend.

## 1. Prerequisites

Install the following before starting:

- Java 21 (JDK)
- Node.js (LTS >= 20)
- PostgreSQL (>= 14)
- Git

Recommended IDEs:

- Backend: IntelliJ IDEA
- Frontend: VS Code

## 2. Backend Setup

### Step 1 - Clone Repository

```bash
git clone <your-repo-url>
cd SmartCampus
```

### Step 2 - Create Root .env File

Create a `.env` file in the project root:

```env
DB_URL=jdbc:postgresql://localhost:5432/smartcampus
DB_USER=postgres
DB_PASSWORD=yourpassword
FRONTEND_URL=http://localhost:5173
BOOTSTRAP_ADMIN_EMAIL=admin@smartcampus.local
BOOTSTRAP_ADMIN_PASSWORD=Admin@12345
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Step 3 - Create Database

```sql
CREATE DATABASE smartcampus;
```

### Step 4 - Run Backend

Windows:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

macOS/Linux:

```bash
cd backend
./mvnw spring-boot:run
```

### Step 5 - Verify Backend

- API base: `http://localhost:8080`
- Actuator: `http://localhost:8080/actuator`

## 3. Frontend Setup

### Step 1 - Navigate to Frontend

```bash
cd frontend
```

### Step 2 - Install Dependencies

```bash
npm install
```

### Step 3 - Frontend Environment

Create `frontend/.env` if needed:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### Step 4 - Run Frontend

```bash
npm run dev
```

### Step 5 - Verify Frontend

- App: `http://localhost:5173`

## 4. Google OAuth Setup

The app already contains the Google OAuth flow in code. You only need to create a Google OAuth client and copy the credentials into `.env`.

### Google Cloud Steps

1. Open the Google Cloud Console.
2. Create or select a project.
3. Configure the OAuth consent screen / branding details.
4. Go to `APIs & Services -> Credentials`.
5. Create an `OAuth client ID`.
6. Choose application type `Web application`.

Use these values for local development:

Authorized JavaScript origin:

```text
http://localhost:5173
```

Authorized redirect URI:

```text
http://localhost:8080/login/oauth2/code/google
```

Then copy the generated values into the root `.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Important notes:

- The redirect URI must match exactly.
- If you get `redirect_uri_mismatch`, re-check the exact redirect URI above.
- After updating `.env`, restart the backend.
- OAuth success will return to the frontend through `/auth/callback`.

## 5. Testing

Backend tests:

```bash
cd backend
./mvnw test
```

Frontend build:

```bash
cd frontend
npm run build
```

## 6. Project Structure

```text
backend/
frontend/
docs/
```

Useful frontend auth files:

- `frontend/src/App.tsx`
- `frontend/src/auth/AuthContext.tsx`
- `frontend/src/components/ProtectedRoute.tsx`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/AuthCallbackPage.tsx`

Useful backend auth files:

- `backend/src/main/resources/application.properties`
- `backend/src/main/java/com/smartcampus/backend/config/SecurityConfig.java`
- `backend/src/main/java/com/smartcampus/backend/config/GoogleOAuth2UserService.java`
- `backend/src/main/java/com/smartcampus/backend/config/OAuth2LoginSuccessHandler.java`

## 7. Common Issues

Google login shows an OAuth error:

- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check that the redirect URI in Google Cloud exactly matches `http://localhost:8080/login/oauth2/code/google`
- Restart the backend after changing `.env`

Frontend cannot talk to backend:

- Make sure `FRONTEND_URL=http://localhost:5173` in root `.env`
- Make sure `VITE_API_BASE_URL=http://localhost:8080` in `frontend/.env`

Database connection fails:

- Make sure PostgreSQL is running
- Check `DB_URL`, `DB_USER`, and `DB_PASSWORD`

## 8. Done

You are ready to run the app with local login and Google OAuth.
