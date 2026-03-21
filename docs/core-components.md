# Core Components - SmartCampus

## Architecture Summary
- Frontend Pattern: Single-page React application (starter scaffold)
- Backend Pattern: Spring Boot monolith with layered packages
- Communication Style: REST-ready backend dependencies are present, but no controllers are implemented yet
- Auth Foundation: Spring Security and OAuth2 client dependencies are configured

## Frontend Components

### Component: `main.tsx`
- Location: `frontend/src/main.tsx`
- Purpose: App entry point that mounts React into the DOM root
- Notes:
  - Uses React `StrictMode`

### Component: `App.tsx`
- Location: `frontend/src/App.tsx`
- Purpose: Current starter UI (Vite + React sample)
- State Managed:
  - `count` local state via `useState`
- Notes:
  - Not yet connected to backend APIs

## Frontend Services and Hooks
- No dedicated frontend service layer or custom hooks are implemented yet.
- Axios and react-router-dom are installed and ready to be integrated.

## Backend Components

### Bootstrap
- `BackendApplication`
  - Location: `backend/src/main/java/com/smartcampus/backend/BackendApplication.java`
  - Responsibility: Starts the Spring Boot application

### Domain Entity
- `User`
  - Location: `backend/src/main/java/com/smartcampus/backend/common/entity/User.java`
  - Responsibility: Represents user accounts persisted in the `users` table
  - Key fields: `name`, `email`, `password`, `role`, `authProvider`, `providerId`, `active`, `createdAt`

### Domain Enums
- `Role`: `USER`, `ADMIN`, `TECHNICIAN`
- `AuthProvider`: `LOCAL`, `GOOGLE`

### Repository
- `UserRepository`
  - Location: `backend/src/main/java/com/smartcampus/backend/common/repository/UserRepository.java`
  - Responsibility: CRUD and query operations for users
  - Custom method: `findByEmail(String email)`

## Planned Module Layout
The following module folders exist and are intended for feature implementation:
- booking
- notification
- resource
- ticket
- user

Each module is scaffolded with subfolders for:
- controller
- service
- repository
- entity
- dto

## Shared/Common Components
- Current shared package: `common`
  - entity definitions
  - repository interfaces
- Security package exists (`security`) but implementation classes are not yet present in source.

## Component Interaction Flows

### Current Implemented Flow
1. Spring Boot starts from `BackendApplication`.
2. JPA manages the `users` table based on the `User` entity.
3. `UserRepository` provides data access methods.

### Planned Request Flow
1. Frontend component calls service/hook.
2. Service sends HTTP request to backend controller.
3. Controller validates input and calls service.
4. Service applies business logic and calls repository.
5. Response is returned and UI state is updated.

## Non-Functional Considerations
- Security: Spring Security dependencies are installed; runtime auth flow is not fully implemented yet.
- Observability: Spring Actuator is included.
- Data Consistency: Email uniqueness enforced at database level via JPA mapping.
- Maintainability: Feature-first module directories already scaffolded for team scaling.

## Notes
- Update this file as soon as controllers/services are added so it remains the source of truth.
