# Tech Stack

## Overview

SmartCampus uses a clean split between frontend, backend, database, and storage.
The first implementation layer is intentionally backend-owned so the team can share one hosted Supabase database without letting multiple clients mutate schema or business rules in different ways.

---

## 1. Frontend

Framework:

- Next.js with App Router

Language:

- TypeScript

Styling:

- Tailwind CSS

Responsibilities:

- UI rendering
- route protection and role-aware navigation
- form handling
- calling Spring Boot APIs
- displaying bookings, tickets, and notifications

Important boundary:

- frontend does not connect directly to the Supabase database
- frontend consumes backend DTOs only

---

## 2. Backend

Framework:

- Spring Boot

Language:

- Java 21

Architecture:

- controller
- service
- repository
- DTO / mapper
- security
- Flyway migrations

Responsibilities:

- business logic
- validation
- auth and role resolution
- conflict detection
- storage coordination
- database access

Key libraries:

- Spring Web
- Spring Data JPA
- Spring Security
- Flyway
- PostgreSQL JDBC driver
- Jakarta Validation
- Lombok

---

## 3. Database

Primary database:

- PostgreSQL via Supabase

Why this setup:

- one hosted online database for all team members
- easier shared development and review
- strong relational support
- direct compatibility with Spring Boot + Flyway

Database ownership model:

- Spring Boot is the only app layer that connects to the database
- Flyway is the only supported path for schema changes
- Supabase dashboard should not be used for manual schema drift

Current schema surface:

- `roles`
- `users`
- `user_roles`
- `locations`
- `resource_categories`
- `resources`
- `resource_availability_windows`
- `bookings`
- `ticket_categories`
- `tickets`
- `ticket_attachments`
- `ticket_comments`
- `ticket_assignments`
- `notifications`
- `audit_logs`

---

## 4. File Storage

Service:

- Supabase Storage

Usage:

- ticket attachment files
- resource image files

Storage model:

- files live in buckets
- database stores metadata such as `storage_bucket` and `storage_path`
- backend owns secure storage integration

---

## 5. Authentication

Methods:

- Google OAuth 2.0 through Spring Security for students
- local email/password credentials through Spring Security-backed sessions for staff and admins

Responsibilities:

- identify the user
- create or update the `users` record
- resolve one active role through `user_roles`
- block non-active users from completing sign-in
- verify local user and active role provisioning before treating Google login as successful
- enforce Google-only login for students
- enforce local-only login for staff and admins
- expose current user state to the frontend

Important note:

- Supabase Auth is not the v1 auth owner
- Supabase is used for database and storage in this setup
- local Google OAuth redirect URI should point to `http://localhost:8080/login/oauth2/code/google`
- local staff/admin passwords are stored only as hashes in `local_auth_credentials`

---

## 6. Authorization

Model:

- role-based access control

Roles:

- `STUDENT`
- `STAFF`
- `ADMIN`

Implementation:

- backend enforces authorization
- frontend mirrors access rules in navigation and page guards

---

## 7. API Design

Style:

- RESTful JSON API

Direction:

- Next.js -> Spring Boot API -> Supabase Postgres / Supabase Storage

Baseline DTO contracts:

- current user
- resource summary
- booking summary
- ticket summary
- notification summary

---

## 8. DevOps and Tooling

Version control:

- Git + GitHub

CI:

- GitHub Actions

Expected backend checks:

- build
- tests
- migration validation through application startup in shared environments

Environment management:

- backend `.env.example` for local setup guidance
- real credentials stay local and untracked

---

## 9. Development Tools

Frontend:

- VS Code
- browser devtools

Backend:

- IntelliJ IDEA or VS Code

Database:

- Supabase dashboard for inspection
- Flyway migrations for schema changes
