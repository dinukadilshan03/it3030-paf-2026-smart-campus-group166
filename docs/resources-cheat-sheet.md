# Resources Cheat Sheet

Quick reference for the active resources module.

## Frontend Entry Points

- [frontend/src/app/(app)/resources/page.tsx](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/app/(app)/resources/page.tsx)
- [frontend/src/app/(app)/resources/add/page.tsx](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/app/(app)/resources/add/page.tsx)
- [frontend/src/app/(app)/resources/analysis/page.tsx](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/app/(app)/resources/analysis/page.tsx)
- [frontend/src/app/(app)/resources/AIChat.tsx](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/app/(app)/resources/AIChat.tsx)

## Frontend Support Code

- [frontend/src/components/resources](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/components/resources)
- [frontend/src/lib/resources/api.ts](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/lib/resources/api.ts)
- [frontend/src/lib/resources/types.ts](/C:/Users/dinuka/Documents/SmartCampus/frontend/src/lib/resources/types.ts)

## Backend Endpoints

- `GET /api/v1/resources`
- `GET /api/v1/resources/{id}`
- `POST /api/v1/resources`
- `PATCH /api/v1/resources/{id}`
- `DELETE /api/v1/resources/{id}`
- `GET /api/v1/resources/{resourceId}/availability`
- `PUT /api/v1/resources/{resourceId}/availability`
- `GET /api/v1/resource-categories`
- `GET /api/v1/locations`

## Common Filters

- `categoryId`
- `locationId`
- `status`
- `minCapacity`
- `search`

## Practical Notes

- admins own resource/category/location mutations
- authenticated users can browse resources
- keep resource types in sync with backend DTOs before changing UI contracts
- availability updates are full replacement operations
- verify AI-related changes against both the UI flow and backend/provider configuration

## Related Docs

- [docs/resource-component-handoff.md](/C:/Users/dinuka/Documents/SmartCampus/docs/resource-component-handoff.md)
- [frontend/resources-backend-endpoints.md](/C:/Users/dinuka/Documents/SmartCampus/frontend/resources-backend-endpoints.md)
