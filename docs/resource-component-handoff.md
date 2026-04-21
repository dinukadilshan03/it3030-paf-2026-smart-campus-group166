# Resources Module Reference

This document describes the current resource-management implementation.

## Scope

The resources area covers:

- resource listing and filtering
- category and location catalogs
- admin resource CRUD
- availability schedule management
- AI-assisted resource exploration pages present in the frontend

## Frontend Areas

- [frontend/src/app/(app)/resources/page.tsx](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/app/(app)/resources/page.tsx)
- [frontend/src/app/(app)/resources/add/page.tsx](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/app/(app)/resources/add/page.tsx)
- [frontend/src/app/(app)/resources/analysis/page.tsx](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/app/(app)/resources/analysis/page.tsx)
- [frontend/src/app/(app)/resources/AIChat.tsx](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/app/(app)/resources/AIChat.tsx)
- [frontend/src/components/resources](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/components/resources)
- [frontend/src/lib/resources](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/lib/resources)

## Backend Areas

- [backend/src/main/java/com/smartcampus/backend/modules/resource](/C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/resource)

The backend owns:

- categories
- locations
- resources
- availability windows
- validation and dependency checks

## Access Model

- authenticated users can browse resources
- admins can create, update, and delete categories, locations, resources, and availability windows

## Main Endpoints

- `GET /api/v1/resource-categories`
- `GET /api/v1/locations`
- `GET /api/v1/resources`
- `GET /api/v1/resources/{id}`
- `POST /api/v1/resources`
- `PATCH /api/v1/resources/{id}`
- `DELETE /api/v1/resources/{id}`
- `GET /api/v1/resources/{id}/availability`
- `PUT /api/v1/resources/{id}/availability`

List filters supported on resources:

- `categoryId`
- `locationId`
- `status`
- `minCapacity`
- `search`

## Key Backend Rules

- category, location, and resource codes must be unique
- category and location references must exist
- capacity cannot be negative when present
- resource delete is blocked if tickets or bookings still reference the resource
- availability windows must have valid day and time ranges
- availability replacement is atomic per resource

## Notes For Contributors

- keep frontend validation lightweight and surface backend validation errors cleanly
- treat the backend as the source of truth for availability and dependency rules
- use [docs/resources-cheat-sheet.md](/C:/Users/dinuka/Documents/SmartCampus/docs/resources-cheat-sheet.md) for a faster frontend-oriented summary
