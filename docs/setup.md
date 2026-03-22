# 🧱 Smart Campus Project – Setup Guide

This guide explains how to set up the project locally for both backend and frontend.

---

# 1. Prerequisites

Install the following before starting:

* Java 21 (JDK)
* Node.js (LTS ≥ 20)
* PostgreSQL (≥ 14)
* Git

### Recommended IDEs

* Backend: IntelliJ IDEA
* Frontend: VS Code

---

# 2. Backend Setup (Spring Boot)

## Step 1 – Clone Repository

```bash
git clone <your-repo-url>
cd backend
```

## Step 2 – Environment Variables

Create a `.env` file in the backend root:

```env
DB_URL=jdbc:postgresql://localhost:5432/smartcampus
DB_USERNAME=postgres
DB_PASSWORD=yourpassword

OAUTH_GOOGLE_CLIENT_ID=your_client_id
OAUTH_GOOGLE_CLIENT_SECRET=your_secret
```

## Step 3 – application.properties

```properties
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

spring.profiles.active=dev
```

## Step 4 – Create Database

```sql
CREATE DATABASE smartcampus;
```

## Step 5 – Run Backend

```bash
./mvnw spring-boot:run
```

Or run the main class in IntelliJ.

## Step 6 – Verify

* API: [http://localhost:8080](http://localhost:8080)
* Actuator: [http://localhost:8080/actuator](http://localhost:8080/actuator)

---

# 3. Frontend Setup (React + Vite)

## Step 1 – Navigate to Frontend

```bash
cd frontend
```

## Step 2 – Install Dependencies

```bash
npm install
```

## Step 3 – Environment Variables

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## Step 4 – Run Frontend

```bash
npm run dev
```

## Step 5 – Verify

* App: [http://localhost:5173](http://localhost:5173)

---

# 4. Testing

## Backend Tests

```bash
./mvnw test
```

## Frontend Lint

```bash
npm run lint
```

---

# 5. OAuth (Google) Setup

1. Go to Google Cloud Console
2. Create OAuth Client
3. Add redirect URI:

```
http://localhost:8080/login/oauth2/code/google
```

---

# 6. Project Structure

```
backend/
  ├── common/
  ├── auth/
  ├── booking/
  ├── resource/
  ├── ticket/
  ├── notification/

frontend/
  ├── src/
  ├── components/
  ├── pages/
  ├── services/
```

---

# 7. Git Workflow

## Branching Strategy

```
main → stable
dev → integration
feature/<name> → development
```

## Example

```bash
git checkout -b feature/booking-api
```

## Rules

* Do NOT commit directly to main
* Always use pull requests
* Write meaningful commit messages

---

# 8. Common Issues

## Port already in use

```bash
kill -9 <port>
```

## Database connection failed

* Ensure PostgreSQL is running
* Check `.env` values

## Node modules issues

```bash
rm -rf node_modules package-lock.json
npm install
```

## Lombok not working

* Enable annotation processing in IntelliJ


# ✅ Done

You are now ready to run and contribute to the project.
