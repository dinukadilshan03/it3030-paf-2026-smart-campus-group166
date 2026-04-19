# Resources Cheat Sheet

**Scope**

- Frontend UI and client API for managing campus resources: listing, filtering, adding, editing, AI-assisted help, and analysis.

**Key frontend components**

- `ResourceList` — displays resource lists and cards: [frontend/src/components/resources/ResourceList.tsx](frontend/src/components/resources/ResourceList.tsx)
- `ResourceFilters` — filter controls (type, availability, location): [frontend/src/components/resources/ResourceFilters.tsx](frontend/src/components/resources/ResourceFilters.tsx)

**Pages / flows**

- List page: [frontend/src/app/(app)/resources/page.tsx](frontend/src/app/(app)/resources/page.tsx)
- Add resource: [frontend/src/app/(app)/resources/add/page.tsx](frontend/src/app/(app)/resources/add/page.tsx)
- Edit resource: [frontend/src/app/(app)/resources/edit/[id]/page.tsx](frontend/src/app/(app)/resources/edit/[id]/page.tsx)
- AI assistant / chat: [frontend/src/app/(app)/resources/AIChat.tsx](frontend/src/app/(app)/resources/AIChat.tsx)
- Analysis / metrics: [frontend/src/app/(app)/resources/analysis/page.tsx](frontend/src/app/(app)/resources/analysis/page.tsx)

**Client API & types**

- `api.ts`: client calls (fetch/list/create/update): [frontend/src/lib/resources/api.ts](frontend/src/lib/resources/api.ts)
- `types.ts`: resource data shapes (e.g., `Resource`, `Availability`): [frontend/src/lib/resources/types.ts](frontend/src/lib/resources/types.ts)

**Common functions / symbols**

- `getResources` / `fetchResources` — list retrieval (see `api.ts`)
- `createResource` / `updateResource` — mutations (see `api.ts`)
- `ResourceList` / `ResourceFilters` — UI wiring

**Where to add fields / validation**

- Update the add form at [frontend/src/app/(app)/resources/add/page.tsx](frontend/src/app/(app)/resources/add/page.tsx) and mirror changes in the edit page.
- Update types in [frontend/src/lib/resources/types.ts](frontend/src/lib/resources/types.ts) and adjust `api.ts` accordingly.

**Integration notes**

- When changing a backend contract, first update `types.ts` and `api.ts` to reflect the new shape, then align backend endpoints.
- Check `AIChat.tsx` prompts and rate limits before modifying AI behavior.

**Run / inspect**

- Frontend: see `frontend/package.json` for dev scripts. Typical dev command:

```bash
cd frontend
pnpm install
pnpm dev
```

- Backend config: [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties)

**Quick TODOs**

- Add form validation and error handling on add/edit pages.
- Add unit tests for `api.ts` (mock fetch) if missing.
- Verify AI assistant UX and prompt wording in `AIChat.tsx`.

---

If you want this note placed somewhere else (frontend folder, repo root, or as a `README`), tell me and I'll move it.

**Backend endpoints (summary)**

- See detailed endpoints copy: [frontend/resources-backend-endpoints.md](frontend/resources-backend-endpoints.md)

- Resources
	- GET `/api/v1/resources` — list resources (query: `categoryId`, `locationId`, `status`, `minCapacity`, `search`)
	- GET `/api/v1/resources/{id}` — resource details
	- POST `/api/v1/resources` — create resource (ADMIN)
	- PATCH `/api/v1/resources/{id}` — update resource (ADMIN)
	- DELETE `/api/v1/resources/{id}` — delete resource (ADMIN)

- Availability
	- GET `/api/v1/resources/{resourceId}/availability` — get availability windows
	- PUT `/api/v1/resources/{resourceId}/availability` — replace availability (ADMIN)

- Categories
	- GET `/api/v1/resource-categories` — list categories
	- GET `/api/v1/resource-categories/{id}` — category details
	- POST/PATCH/DELETE `/api/v1/resource-categories` (and `/{id}`) — mutating ops (ADMIN)

- Locations
	- GET `/api/v1/locations` — list locations
	- GET `/api/v1/locations/{id}` — location details
	- POST/PATCH/DELETE `/api/v1/locations` (and `/{id}`) — mutating ops (ADMIN)

