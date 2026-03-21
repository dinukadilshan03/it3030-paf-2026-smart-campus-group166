# Database Schema - SmartCampus

## Overview
- Database Engine: PostgreSQL
- ORM Layer: Spring Data JPA + Hibernate
- Naming Convention: Java fields use camelCase; database naming follows Spring/Hibernate defaults.
- Migration Strategy: No migration tool configured yet; schema is currently managed by Hibernate auto update.
- Hibernate DDL Mode: `spring.jpa.hibernate.ddl-auto=update`

## Entity List
- `User` (`users` table)
- `Role` enum (`USER`, `ADMIN`, `TECHNICIAN`)
- `AuthProvider` enum (`LOCAL`, `GOOGLE`)

## Table Definitions

### Table: `users`
Purpose: Stores application user accounts, credentials, and auth provider details.

Columns (from `User` entity):
- `id`: bigint, primary key, auto-generated identity
- `name`: varchar, not null
- `email`: varchar, unique, not null
- `password`: varchar, not null
- `role`: varchar (enum as string), nullable unless enforced at service level
- `auth_provider`: varchar (enum as string), nullable unless enforced at service level
- `provider_id`: varchar, nullable
- `active`: boolean, defaults to true in `@PrePersist` when null
- `created_at`: timestamp, set in `@PrePersist`

Indexes and constraints:
- Unique constraint/index on `email`
- Primary key on `id`

Relationships:
- No foreign-key relationships are defined yet.

## Relationship Summary
- Current schema has one standalone table: `users`
- No one-to-many, many-to-many, or one-to-one relationships are implemented yet.

## ER Diagram
Current state:
- users

## Sample SQL Snippets

Create table (representative):
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50),
  auth_provider VARCHAR(50),
  provider_id VARCHAR(255),
  active BOOLEAN,
  created_at TIMESTAMP
);
```

Unique index (representative):
```sql
CREATE UNIQUE INDEX uk_users_email ON users(email);
```

## Data Integrity Rules
- Every user must have `name`, `email`, and `password`.
- `email` must be unique.
- `active` defaults to true when user is first persisted and value is null.

## Seed Data
- Seed mechanism is not implemented yet.
- Expected initial enum values:
  - Roles: `USER`, `ADMIN`, `TECHNICIAN`
  - Auth providers: `LOCAL`, `GOOGLE`

## Notes
- Add migration tooling (Flyway or Liquibase) before production.
- Add explicit nullable constraints for enum fields if required by business rules.
