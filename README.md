# SmartCampus

## Project Overview
SmartCampus is a full-stack web application intended to centralize core campus operations in one platform. The current codebase includes the initial backend domain model and repository layer, along with a React frontend scaffold.

## Tech Stack

### Frontend
- Framework: React 19
- Language: TypeScript 5.9
- Build Tool: Vite 7
- Routing Library: react-router-dom 7 (installed)
- HTTP Client: Axios (installed)
- Styling: CSS

### Backend
- Runtime: Java 21
- Framework: Spring Boot 3.5.11
- Data Access: Spring Data JPA (Hibernate)
- Security: Spring Security + OAuth2 Client
- Validation: Spring Validation

### Database
- Database Engine: PostgreSQL
- ORM: Hibernate (via Spring Data JPA)
- Schema Strategy: `spring.jpa.hibernate.ddl-auto=update`

### Dev Tools
- Backend Build Tool: Maven Wrapper (`mvnw`, `mvnw.cmd`)
- Frontend Package Manager: npm
- Linting: ESLint (frontend)
- Version Control: Git

## Prerequisites
Install the following before running locally:

- Git
- Java 21
- Node.js and npm
- PostgreSQL

Optional:
- Docker Desktop (if you prefer running PostgreSQL in containers)
- VS Code or IntelliJ IDEA

## Environment Variables
The backend reads DB credentials from environment variables in `backend/src/main/resources/application.properties`.

Required variables:
- `DB_URL`
- `DB_USER`
- `DB_PASSWORD`

Recommended workflow:
1. Create a `.env.example` file with safe placeholder values.
2. Create your local `.env` file from `.env.example`.
3. Keep real secrets only in `.env`.

Security rule:
- Never commit the real `.env` file.
- Only commit `.env.example`.

Example `.env.example`:
```env
DB_URL=jdbc:postgresql://localhost:5432/smartcampus
DB_USER=smartcampus_user
DB_PASSWORD=change_me
```

## Local Setup Instructions

### 1. Clone Repository
```bash
git clone <repository-url>
cd SmartCampus
```

### 2. Configure Environment Variables
Create and populate your local `.env` file with values for `DB_URL`, `DB_USER`, and `DB_PASSWORD`.

### 3. Start PostgreSQL
Ensure PostgreSQL is running and the database/user in `DB_URL` and `DB_USER` exist.

### 4. Run Backend
Windows PowerShell:
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

macOS/Linux:
```bash
cd backend
./mvnw spring-boot:run
```

### 5. Run Frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```

### 6. Access the App
- Frontend: http://localhost:5173
- Backend: http://localhost:8080

## Project Directory Structure
```text
SmartCampus/
|-- README.md
|-- LICENSE
|-- docs/
|   |-- database-schema.md
|   |-- core-components.md
|   `-- api-endpoints.md
|-- backend/
|   |-- pom.xml
|   |-- mvnw
|   |-- mvnw.cmd
|   `-- src/
|       |-- main/
|       |   |-- java/com/smartcampus/backend/
|       |   |   |-- BackendApplication.java
|       |   |   `-- common/
|       |   |       |-- entity/
|       |   |       |   |-- User.java
|       |   |       |   |-- Role.java
|       |   |       |   `-- AuthProvider.java
|       |   |       `-- repository/
|       |   |           `-- UserRepository.java
|       |   `-- resources/
|       |       `-- application.properties
|       `-- test/
`-- frontend/
    |-- package.json
    |-- vite.config.ts
    |-- tsconfig.json
    `-- src/
        |-- main.tsx
        |-- App.tsx
        |-- index.css
        |-- App.css
        `-- assets/
```

## Current Project Status
- Backend API controllers are not implemented yet.
- Backend currently contains foundational user domain entities and repository.
- Frontend is currently on the default Vite + React starter view.
