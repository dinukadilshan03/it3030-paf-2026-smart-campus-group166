# Tech Stack

## Overview

This project uses a **modern full-stack architecture** with a clear separation between frontend, backend, database, and infrastructure layers.

The stack is designed to:

* satisfy assignment requirements (React client + Spring Boot API)
* support team collaboration
* enable scalable and clean architecture
* integrate authentication, storage, and notifications

---

# 1. Frontend

## Framework

* **Next.js (App Router)**

## Language

* **TypeScript**

## Styling

* **Tailwind CSS**

## State & Data Fetching

* Native React state + hooks
* Optional: React Query (recommended)

## Responsibilities

* UI rendering
* Form handling
* API communication
* Role-based routing
* Display workflows (bookings, tickets, notifications)

## Key Features Used

* File-based routing
* Server & Client components
* API route integration (optional proxy)
* Middleware for route protection

---

# 2. Backend

## Framework

* **Spring Boot**

## Language

* **Java**

## Architecture

* Layered architecture:

  * Controller
  * Service
  * Repository
  * DTO / Mapper
  * Security

## Responsibilities

* Business logic
* Validation
* Authentication handling
* Authorization (RBAC)
* Booking conflict detection
* Ticket workflow management
* Notification triggering

## Key Libraries

* Spring Web
* Spring Data JPA
* Spring Security
* Bean Validation (Jakarta Validation)
* Lombok (optional)

---

# 3. Database

## Primary Database

* **PostgreSQL (via Supabase)**

## Why Supabase

* Managed PostgreSQL
* Easy setup for team collaboration
* Built-in authentication support (optional)
* Integrated storage for files

## Responsibilities

* Persistent data storage
* Relational integrity
* Query performance
* Support for all entities:

  * users
  * resources
  * bookings
  * tickets
  * comments
  * notifications

---

# 4. File Storage

## Service

* **Supabase Storage**

## Usage

* Ticket attachments (images)
* Resource images

## Features

* Public/private buckets
* Secure file access
* Easy integration with backend

---

# 5. Authentication

## Method

* **Google OAuth 2.0**

## Flow

* User logs in via Google
* Backend validates token
* User record created or retrieved
* Session/JWT issued

## Responsibilities

* User identity verification
* Secure login
* Integration with RBAC

---

# 6. Authorization

## Model

* **Role-Based Access Control (RBAC)**

## Roles

* STUDENT
* STAFF
* ADMIN

## Implementation

* Backend: Spring Security
* Frontend: route protection + UI guards

---

# 7. API Design

## Style

* **RESTful API**

## Format

* JSON request/response

## Standards

* Proper HTTP methods:

  * GET
  * POST
  * PUT / PATCH
  * DELETE
* Consistent error responses
* DTO-based data transfer

---

# 8. DevOps & Tooling

## Version Control

* **Git + GitHub**

## CI/CD

* **GitHub Actions**

## CI Tasks

* Frontend build
* Backend build
* Linting (optional)
* Tests (optional but recommended)

## Environment Management

* `.env` files
* `.env.example` for setup

---

# 9. Development Tools

## Frontend

* VS Code
* Chrome DevTools

## Backend

* IntelliJ IDEA / VS Code

## Database

* Supabase Dashboard


