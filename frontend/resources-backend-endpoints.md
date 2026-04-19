# Resources — Backend Endpoints

All endpoints are under `/api/v1`.

Resources

- GET `/api/v1/resources`
  - Query params: `categoryId`, `locationId`, `status`, `minCapacity`, `search`
- GET `/api/v1/resources/{id}`
- POST `/api/v1/resources` — ADMIN
- PATCH `/api/v1/resources/{id}` — ADMIN
- DELETE `/api/v1/resources/{id}` — ADMIN

Availability

- GET `/api/v1/resources/{resourceId}/availability`
- PUT `/api/v1/resources/{resourceId}/availability` — ADMIN

Resource categories

- GET `/api/v1/resource-categories`
- GET `/api/v1/resource-categories/{id}`
- POST `/api/v1/resource-categories` — ADMIN
- PATCH `/api/v1/resource-categories/{id}` — ADMIN
- DELETE `/api/v1/resource-categories/{id}` — ADMIN

Locations

- GET `/api/v1/locations`
- GET `/api/v1/locations/{id}`
- POST `/api/v1/locations` — ADMIN
- PATCH `/api/v1/locations/{id}` — ADMIN
- DELETE `/api/v1/locations/{id}` — ADMIN

Controllers (backend source)

- `ResourceController` — `backend/src/main/java/.../modules/resource/controller/ResourceController.java`
- `ResourceAvailabilityController` — `backend/src/main/java/.../modules/resource/controller/ResourceAvailabilityController.java`
- `ResourceCategoryController` — `backend/src/main/java/.../modules/resource/controller/ResourceCategoryController.java`
- `LocationController` — `backend/src/main/java/.../modules/resource/controller/LocationController.java`
