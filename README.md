<div align="center">

# 🎓 SmartCampus

**A modern, full-stack campus operations platform**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Railway-blueviolet?style=for-the-badge&logo=railway)](https://triumphant-warmth-production-14f0.up.railway.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?style=for-the-badge&logo=spring-boot)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk)](https://openjdk.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

SmartCampus is a complete campus operations platform that streamlines resource management, room bookings, support ticketing, notifications, and administrative oversight — all in one role-aware application.

[🚀 Live Demo](https://triumphant-warmth-production-14f0.up.railway.app/) · [📖 Docs](docs/) · [🐛 Report Bug](../../issues) · [💡 Request Feature](../../issues)

</div>

---

## 📸 Screenshots

> Place your screenshots in the `images/` folder and update the paths below.

### Landing Page
![Landing Page](images/homepage.png)

### Dashboard
> _Add screenshot: `images/dashboard.png`_
<!-- ![Dashboard](images/dashboard.png) -->

### Resource Directory
![Resource - Computer Lab](images/computer_lab.jpg)

### Bookings
> _Add screenshot: `images/bookings.png`_
<!-- ![Bookings](images/bookings.png) -->

### Ticketing
> _Add screenshot: `images/tickets.png`_
<!-- ![Tickets](images/tickets.png) -->

### Analytics (Admin)
> _Add screenshot: `images/analytics.png`_
<!-- ![Analytics](images/analytics.png) -->

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Setup & Installation](#-setup--installation)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Configure Supabase](#2-configure-supabase)
  - [3. Configure Google OAuth](#3-configure-google-oauth)
  - [4. Backend Setup](#4-backend-setup)
  - [5. Frontend Setup](#5-frontend-setup)
- [Environment Variables](#-environment-variables)
  - [Backend](#backend-env)
  - [Frontend](#frontend-env)
- [Running the Application](#-running-the-application)
- [Application Routes](#-application-routes)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [License](#-license)

---

## 🧭 Overview

SmartCampus is a split-architecture, full-stack web application with a **Next.js** frontend and a **Spring Boot** backend. Supabase provides the PostgreSQL database and file storage.

The application supports **three role-aware experiences**:

| Role | Capabilities |
|------|-------------|
| 🎓 **STUDENT** | Browse resources, create bookings, raise support tickets, track updates, manage profile |
| 🛠️ **STAFF** | Work assigned tickets, add operational updates, manage profile |
| 👑 **ADMIN** | Full management of users, resources, bookings, tickets, notifications, analytics, and profile |

> **Architecture note:** The frontend never connects to Supabase directly. All business logic, authentication, and data access flow through the Spring Boot backend.

---

## ✨ Features

### 🔐 Authentication & Authorization
- Google OAuth 2.0 sign-in for students
- Local email/password login for staff and admins
- Role-based route protection and navigation
- Account lockout after configurable failed login attempts
- Temporary password enforcement for new local accounts

### 🏢 Resource Management
- Browse campus resources by category and location
- Admin CRUD for resources, categories, and locations
- Image uploads via Supabase Storage
- Availability window management per resource

### 📅 Bookings
- Submit booking requests with date, time, and purpose
- Backend-enforced overlap and availability validation
- Admin approval, rejection, and cancellation workflows
- Requester-initiated cancellation for allowed bookings

### 🎫 Support Ticketing
- Create tickets with category, description, and file attachments
- Full lifecycle: `OPEN → IN_PROGRESS → RESOLVED → CLOSED`
- Admin ticket assignment to staff
- Threaded comments with internal staff/admin notes
- File attachment support via Supabase Storage

### 🔔 Notifications
- Automatic notifications for booking outcomes, ticket assignments, status changes, and comments
- Unread tracking and notification history center

### 📊 Analytics (Admin)
- Reporting dashboard for resources, bookings, and tickets
- AI-assisted insights via Google Gemini or Groq

### 👤 Profile Management
- Self-service account details update
- Password change flows

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| [Next.js](https://nextjs.org/) | 16 | React framework with App Router |
| [React](https://react.dev/) | 19 | UI runtime |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Type-safe JavaScript |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Utility-first styling |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| [Spring Boot](https://spring.io/projects/spring-boot) | 3.5 | Application framework |
| [Java](https://openjdk.org/) | 21 | Runtime language |
| [Spring Security](https://spring.io/projects/spring-security) | — | Auth & OAuth2 |
| [Spring Data JPA](https://spring.io/projects/spring-data-jpa) | — | ORM & persistence |
| [Flyway](https://flywaydb.org/) | — | Database schema migrations |
| [Maven Wrapper](https://maven.apache.org/wrapper/) | — | Build tool |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| [Supabase](https://supabase.com/) | PostgreSQL database + file storage |
| [Railway](https://railway.app/) | Cloud hosting for frontend & backend |

### AI Integrations (optional)
| Provider | Use Case |
|----------|---------|
| Google Gemini | AI-assisted analytics & chat |
| Groq | Alternative analytics AI provider |
| OpenRouter | Ticketing assistant |

---

## 📁 Project Structure

```text
SmartCampus/
├── backend/              # Spring Boot API
│   ├── src/              # Java source — controllers, services, repositories, entities
│   ├── .env.example      # Backend environment variable template
│   └── pom.xml           # Maven project descriptor
│
├── frontend/             # Next.js web application
│   ├── src/              # App Router pages, components, API clients
│   ├── public/           # Static assets
│   ├── .env.local.example# Frontend environment variable template
│   └── package.json
│
├── docs/                 # Architecture, deployment, API, and module docs
│   ├── deployment.md
│   ├── tech-stack.md
│   ├── workflows.md
│   ├── entity.md
│   ├── api/endpoints.md
│   ├── database/
│   ├── booking-component-handoff.md
│   ├── resource-component-handoff.md
│   └── ticket-component-handoff.md
│
├── images/               # Screenshots and supporting media
├── legacy-backend/       # Historical reference (not active)
├── legacy-frontend/      # Historical reference (not active)
└── README.md
```

---

## ✅ Prerequisites

Make sure you have the following installed before setting up the project locally:

| Tool | Version | Download |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) |
| Java JDK | 21 | [openjdk.org](https://openjdk.org/) |
| Git | latest | [git-scm.com](https://git-scm.com/) |
| A Supabase account | — | [supabase.com](https://supabase.com/) |
| A Google Cloud project | — | [console.cloud.google.com](https://console.cloud.google.com/) |

---

## 🚀 Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/dinukadilshan03/it3030-paf-2026-smart-campus-group166.git
cd it3030-paf-2026-smart-campus-group166
```

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com/).
2. Navigate to **Project Settings → Database** and copy your connection strings (both pooler and direct modes are supported).
3. Navigate to **Project Settings → API** and copy your `Project URL` and `service_role` secret key.
4. Create two storage buckets in **Storage**:
   - `resource-images` — for resource photos
   - `ticket-attachments` — for ticket file uploads
5. Keep these values ready for the backend environment file.

### 3. Configure Google OAuth

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create (or select) a project.
2. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
3. Set **Application type** to **Web application**.
4. Add the following **Authorized redirect URI** for local development:
   ```
   http://localhost:8080/login/oauth2/code/google
   ```
5. Copy the **Client ID** and **Client Secret** for the backend environment file.

### 4. Backend Setup

```bash
cd backend
```

Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

> See the [Environment Variables → Backend](#backend-env) section for a full description of each variable.

#### Run the backend (macOS / Linux)

```bash
./mvnw spring-boot:run
```

#### Run the backend (Windows)

```powershell
.\mvnw.cmd spring-boot:run
```

The API will be available at **http://localhost:8080**.

> **First run:** Flyway will automatically apply all database migrations to your Supabase instance. A bootstrap admin account is created from `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_TEMP_PASSWORD`.

### 5. Frontend Setup

Open a new terminal:

```bash
cd frontend
```

Copy the environment template and fill in your values:

```bash
cp .env.local.example .env.local
```

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The app will be available at **http://localhost:3000**.

---

## 🔧 Environment Variables

### Backend ENV

Copy `backend/.env.example` to `backend/.env` and configure the following:

#### Database (Supabase)

| Variable | Description |
|----------|-------------|
| `DB_CONNECTION_MODE` | `pooler` or `direct` — choose based on your network |
| `DB_URL_POOLER` | JDBC URL for Supabase pooler connection |
| `DB_URL_DIRECT` | JDBC URL for Supabase direct connection |
| `DB_USER_POOLER` | DB username for pooler mode (`postgres.<project-ref>`) |
| `DB_USER_DIRECT` | DB username for direct mode (`postgres`) |
| `DB_PASSWORD` | Supabase database password |
| `DB_MAX_POOL_SIZE` | Max connection pool size (default: `5`) |
| `DB_MIN_IDLE` | Min idle connections (default: `1`) |
| `DB_CONNECTION_TIMEOUT_MS` | Connection timeout in ms (default: `30000`) |

#### Application

| Variable | Description |
|----------|-------------|
| `FRONTEND_URL` | Public URL of the frontend (e.g., `http://localhost:3000`) |
| `BOOTSTRAP_ADMIN_EMAIL` | Email for the auto-created admin account on first run |
| `BOOTSTRAP_ADMIN_TEMP_PASSWORD` | Temporary password for the bootstrap admin |

#### Supabase Storage

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role secret key |
| `SUPABASE_RESOURCE_IMAGES_BUCKET` | Bucket name for resource images (e.g., `resource-images`) |
| `SUPABASE_TICKET_ATTACHMENTS_BUCKET` | Bucket name for ticket files (e.g., `ticket-attachments`) |

#### Google OAuth

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret |

#### Security

| Variable | Description |
|----------|-------------|
| `LOCAL_AUTH_MAX_FAILED_ATTEMPTS` | Max failed login attempts before account lock (default: `5`) |
| `LOCAL_AUTH_LOCK_DURATION_MINUTES` | Lock duration in minutes (default: `15`) |

#### AI / Analytics (Optional)

| Variable | Description |
|----------|-------------|
| `ANALYTICS_TIMEZONE` | Timezone for analytics (e.g., `Asia/Colombo`) |
| `ANALYTICS_AI_ENABLED` | Enable AI analytics (`true`/`false`) |
| `ANALYTICS_AI_PROVIDER` | AI provider (`groq` or `google-genai`) |
| `ANALYTICS_AI_MODEL` | Model name (e.g., `llama-3.1-8b-instant`) |
| `ANALYTICS_AI_TIMEOUT_MS` | AI request timeout in ms (default: `8000`) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `SPRING_AI_CHAT_MODEL` | Spring AI model name (e.g., `google-genai`) |
| `Ticketing_API_KEY` | OpenRouter API key for ticketing AI assistant |

### Frontend ENV

Copy `frontend/.env.local.example` to `frontend/.env.local`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL visible to the browser (e.g., `http://localhost:8080`) |
| `BACKEND_INTERNAL_URL` | *(Production only)* Private Railway internal URL for server-side rewrites |

---

## ▶️ Running the Application

Start both services in separate terminals:

**Terminal 1 — Backend**
```bash
cd backend
./mvnw spring-boot:run        # macOS / Linux
# .\mvnw.cmd spring-boot:run  # Windows
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |

Log in with the bootstrap admin credentials you set in the backend `.env` file, then create student/staff accounts from the admin panel.

---

## 🗺 Application Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing / marketing page |
| `/login` | Public | Staff & admin local login; student Google sign-in |
| `/dashboard` | All roles | Role-aware home workspace |
| `/resources` | All roles | Resource directory; admin management |
| `/bookings` | Student, Admin | Booking creation and review |
| `/tickets` | All roles | Support ticketing (role-scoped views) |
| `/notifications` | All roles | Notification history center |
| `/users` | Admin | User management |
| `/profile` | All roles | Account details and password change |
| `/analytics` | Admin | Reporting dashboard with AI insights |

---

## ☁️ Deployment

The production application is hosted on **Railway**. Both the frontend and backend are separate Railway services sharing Supabase for data and storage.

**Live frontend:** [https://triumphant-warmth-production-14f0.up.railway.app/](https://triumphant-warmth-production-14f0.up.railway.app/)

### Quick Deployment Reference

| Service | Root Directory | Build Command | Start Command |
|---------|---------------|---------------|---------------|
| Backend | `backend` | `./mvnw -DskipTests package` | `java -jar target/backend-0.0.1-SNAPSHOT.jar` |
| Frontend | `frontend` | `npm install && npm run build` | `npm run start` |

### URL Wiring (Production)

1. Set `FRONTEND_URL` on the backend to the exact public frontend origin.
2. Set `BACKEND_INTERNAL_URL` on the frontend to the Railway private backend URL.
3. Set `NEXT_PUBLIC_API_BASE_URL` on the frontend to the backend public HTTPS URL.
4. Add the production Google OAuth redirect URI in Google Cloud Console:
   ```
   https://<your-backend-domain>/login/oauth2/code/google
   ```

> See [docs/deployment.md](docs/deployment.md) for the full deployment guide and post-deployment smoke-test checklist.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [docs/deployment.md](docs/deployment.md) | Production & Railway deployment guide |
| [docs/tech-stack.md](docs/tech-stack.md) | Architecture and technology decisions |
| [docs/workflows.md](docs/workflows.md) | Product workflows and role behavior |
| [docs/api/endpoints.md](docs/api/endpoints.md) | Backend REST API reference |
| [docs/entity.md](docs/entity.md) | Entity and schema design notes |
| [docs/database/schema.md](docs/database/schema.md) | Database schema summary |
| [docs/database/relationships.md](docs/database/relationships.md) | Entity relationships |
| [docs/team-handoff.md](docs/team-handoff.md) | Project status and repo orientation |
| [docs/resource-component-handoff.md](docs/resource-component-handoff.md) | Resources module reference |
| [docs/booking-component-handoff.md](docs/booking-component-handoff.md) | Bookings module reference |
| [docs/ticket-component-handoff.md](docs/ticket-component-handoff.md) | Tickets module reference |

---

## 📝 Notes

- The active application lives in `frontend/` and `backend/`.
- The `legacy-frontend/` and `legacy-backend/` directories are retained for historical reference only and are **not** the current production app.
- The frontend does **not** connect to Supabase directly — all business logic and data access flow through the Spring Boot backend.

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.
