# Smart Campus Operations Hub

## Overview
This project is a comprehensive web platform developed to manage day-to-day university operations. It centralizes facility and asset bookings, alongside maintenance and incident handling. The system enforces clear workflows, role-based access control (RBAC), and strict auditability to modernize campus management.

## Tech Stack
**Frontend:**
* Framework: React 19
* Language: TypeScript 5.9
* Build Tool: Vite 7
* Routing: react-router-dom 7
* HTTP Client: Axios
* Styling: CSS

**Backend:**
* Runtime: Java 21
* Framework: Spring Boot 3.5.11
* Data Access: Spring Data JPA (Hibernate)
* Security: Spring Security + OAuth2 Client
* Validation: Spring Validation

**Database:**
* Engine: PostgreSQL
* Schema Strategy: `spring.jpa.hibernate.ddl-auto=update`

## Core Modules
* **Module A - Facilities & Assets Catalogue:** Management of bookable resources (lecture halls, labs, equipment) with search and filtering.
* **Module B - Booking Management:** End-to-end booking workflow with scheduling conflict prevention.
* **Module C - Maintenance & Incident Ticketing:** Fault reporting system with image attachments and technician assignment.
* **Module D - Notifications:** Real-time web UI updates for booking and ticket status changes.
* **Module E - Authentication & Authorization:** Secure OAuth 2.0 (Google) login with `USER` and `ADMIN` roles.

## Local Setup Instructions

### 1. Prerequisites
Install these tools on your machine:

* Git
* Java 21
* Node.js (LTS) + npm
* PostgreSQL (15+ recommended)

### 2. Clone the Repository
If you have not cloned yet:

```bash
git clone <your-repo-url>
cd SmartCampus
```

### 3. Configure Environment Variables (Backend)
The backend reads database credentials from environment variables referenced in `backend/src/main/resources/application.properties`.

Create a file named `.env` inside the `backend` folder:

```env
DB_URL=jdbc:postgresql://localhost:5432/smartcampus
DB_USER=smartcampus_user
DB_PASSWORD=change_me
```

Security note:

* Never commit your real `.env` file.
* Commit only a safe `.env.example` template.

### 4. Create the PostgreSQL Database
Create a database and user that match your `.env` values.

Example SQL:

```sql
CREATE DATABASE smartcampus;
CREATE USER smartcampus_user WITH ENCRYPTED PASSWORD 'change_me';
GRANT ALL PRIVILEGES ON DATABASE smartcampus TO smartcampus_user;
```

### 5. Start the Backend
From project root:

Windows (PowerShell):

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

macOS/Linux:

```bash
cd backend
./mvnw spring-boot:run
```

Backend runs on:

* http://localhost:8080

### 6. Start the Frontend
Open a second terminal from project root:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

* http://localhost:5173

### 7. Verify the Setup
Check these URLs:

* Frontend: http://localhost:5173
* Backend: http://localhost:8080

If backend starts successfully, Hibernate will auto-manage schema updates because `spring.jpa.hibernate.ddl-auto=update` is enabled.

## Quick Start (After First-Time Setup)

Terminal 1:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Terminal 2:

```bash
cd frontend
npm run dev
```

