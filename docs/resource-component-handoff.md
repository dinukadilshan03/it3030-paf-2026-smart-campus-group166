# Resource Component Handoff

## Scope

This module is the full resource-management workflow. The backend is already implemented. The frontend route still uses a placeholder and is ready to be replaced with the real UI.

Your job is to build the actual frontend experience on top of the existing APIs and role-aware app shell.

Route to replace:

- [frontend/src/app/(app)/resources/page.tsx](C:/Users/dinuka/Documents/SmartCampus/frontend/src/app/(app)/resources/page.tsx)

Relevant backend module:

- [backend/src/main/java/com/smartcampus/backend/modules/resource](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/resource)

## What Is Already Done

### Backend coverage

Implemented backend areas:

- resource categories
- locations
- resources
- resource availability windows

Main backend files:

- [ResourceCategoryController.java](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/resource/controller/ResourceCategoryController.java)
- [LocationController.java](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/resource/controller/LocationController.java)
- [ResourceController.java](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/resource/controller/ResourceController.java)
- [ResourceAvailabilityController.java](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/resource/controller/ResourceAvailabilityController.java)
- [ResourceService.java](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/resource/service/ResourceService.java)
- [ResourceAvailabilityService.java](C:/Users/dinuka/Documents/SmartCampus/backend/src/main/java/com/smartcampus/backend/modules/resource/service/ResourceAvailabilityService.java)

### Access model

- authenticated users can read resource data
- admins can create, update, and delete

### Business rules already enforced in backend

- category code must be unique
- location code must be unique
- resource code must be unique
- resource category must exist
- location must exist
- capacity must be non-negative when present
- delete category is blocked if resources still reference it
- delete location is blocked if resources or tickets still reference it
- delete resource is blocked if bookings or tickets still reference it
- availability windows validate day, time range, and effective date range
- availability updates replace the full resource schedule atomically

### Frontend shell status

The route exists, but only as a placeholder page. Role-based navigation already exposes this route where appropriate.

## APIs You Should Use

### Resource categories

- `GET /api/v1/resource-categories`
- `GET /api/v1/resource-categories/{id}`
- `POST /api/v1/resource-categories`
- `PATCH /api/v1/resource-categories/{id}`
- `DELETE /api/v1/resource-categories/{id}`

Main DTOs:

- `ResourceCategorySummaryResponse`
- `ResourceCategoryDetailResponse`
- `CreateResourceCategoryRequest`
- `UpdateResourceCategoryRequest`

### Locations

- `GET /api/v1/locations`
- `GET /api/v1/locations/{id}`
- `POST /api/v1/locations`
- `PATCH /api/v1/locations/{id}`
- `DELETE /api/v1/locations/{id}`

Main DTOs:

- `LocationSummaryResponse`
- `LocationDetailResponse`
- `CreateLocationRequest`
- `UpdateLocationRequest`

### Resources

- `GET /api/v1/resources`
- `GET /api/v1/resources/{id}`
- `POST /api/v1/resources`
- `PATCH /api/v1/resources/{id}`
- `DELETE /api/v1/resources/{id}`

Supported filters on list:

- `categoryId`
- `locationId`
- `status`
- `minCapacity`
- `search`

Main DTOs:

- `ResourceSummaryResponse`
- `ResourceDetailResponse`
- `CreateResourceRequest`
- `UpdateResourceRequest`

### Availability

- `GET /api/v1/resources/{id}/availability`
- `PUT /api/v1/resources/{id}/availability`

Main DTOs:

- `ResourceAvailabilityWindowResponse`
- `ReplaceResourceAvailabilityRequest`
- `ResourceAvailabilityWindowRequest`

## What The Frontend Should Build

Recommended structure:

- resource overview/list page
- admin management areas for:
  - categories
  - locations
  - resources
  - availability editor

Recommended UI sections:

1. Resource directory
- searchable/filterable list of resources
- show code, name, category, location, capacity, status, requires approval

2. Resource detail or edit panel
- create/edit form for resource fields
- admin-only actions

3. Supporting catalogs
- category list and create/edit/delete
- location list and create/edit/delete

4. Availability editor
- per-resource schedule editor
- frontend should send the complete set of windows in one `PUT`

## Suggested Frontend Ownership Split

If multiple people touch this module, split by area:

- teammate 1: categories and locations
- teammate 2: resource list/detail/create/edit
- teammate 3: availability editor

## Suggested Frontend File Layout

Suggested new frontend area:

- `frontend/src/components/resources`
- `frontend/src/lib/resources`

Suggested files:

- `ResourceManagementPage.tsx`
- `ResourceFilters.tsx`
- `ResourceList.tsx`
- `ResourceDetailPanel.tsx`
- `ResourceFormDialog.tsx`
- `CategoryManager.tsx`
- `LocationManager.tsx`
- `AvailabilityEditor.tsx`
- `frontend/src/lib/resources/api.ts`
- `frontend/src/lib/resources/types.ts`

## Suggested Role Behavior In UI

- `STUDENT`
  - browse resources only
- `STAFF`
  - browse resources only
- `ADMIN`
  - browse plus full CRUD and availability management

Use the existing frontend session and route protection. Do not rebuild auth.

## Practical Notes

- image upload/storage is not part of this module yet
- `imageUrl` is metadata only
- backend already handles validation and dependency protection, so surface backend error messages in the UI
- use the `/users` page as a reference for admin workflow structure and mutation refresh patterns

## Suggested First Milestone

Build this first:

1. resource list with filters
2. create/edit resource form
3. category and location dropdown loading
4. admin-only create/edit actions

After that, add:

1. category manager
2. location manager
3. availability editor

