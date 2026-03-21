# API Endpoints - SmartCampus

## API Overview
- Base URL (local): http://localhost:8080
- API Style: REST (planned)
- Authentication: Spring Security + OAuth2 client dependencies are present; endpoint-level auth rules are not implemented yet
- Current State: No controller classes or request mappings are currently defined in source

## Current Implemented Endpoints
No API routes are implemented at this stage.

## Planned Endpoint Groups
Based on module scaffolding, endpoints are expected to be added for:
- booking
- notification
- resource
- ticket
- user

## Endpoint Documentation Template (Use Per Route)

### METHOD /api/v1/<resource>
Purpose: Describe what this endpoint does.

Auth Required: Yes or No
Roles Allowed: USER, ADMIN, TECHNICIAN (or specific subset)

Request Headers:
- Content-Type: application/json
- Authorization: Bearer <token> (if required)

Path Params:
- id: long - Example path ID

Query Params:
- page: int - Optional
- size: int - Optional

Request Body Example:
```json
{
  "field": "value"
}
```

Success Response Example:
```json
{
  "message": "success"
}
```

Error Response Example:
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request body is invalid"
}
```

## Response and Error Conventions
- Content type: application/json
- Suggested timestamp format: ISO-8601
- Suggested error shape:
  - code
  - message
  - details
  - timestamp

## Suggested Status Code Matrix
- 200: Successful read/update
- 201: Resource created
- 204: Resource deleted/no content
- 400: Validation error
- 401: Authentication required
- 403: Authorization failed
- 404: Resource not found
- 409: Conflict
- 500: Server error

## Testing Checklist
- [ ] Happy path tested
- [ ] Validation errors tested
- [ ] Unauthorized access tested
- [ ] Role-based access tested
- [ ] Edge cases tested

## Notes
- Once controller classes are added, replace the planned groups with exact METHOD + path mappings.
- Keep this file synchronized with controller annotations to maintain a single source of truth.
