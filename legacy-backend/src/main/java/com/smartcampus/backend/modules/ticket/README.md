# Ticket Module

This module handles maintenance and incident tracking in the Smart Campus backend.

It follows the folder layout:

- `controller` for HTTP endpoints
- `dto` for request and response payload classes
- `entity` for JPA entities mapped to database tables
- `repository` for Spring Data JPA access
- `service` for business logic

## What This Module Covers

The `ticket` module currently supports four main maintenance areas:

1. `Ticket`
   Main issue or maintenance request created by a user.
2. `TicketAssignment`
   Tracks which technician was assigned to a ticket.
3. `TicketComment`
   Stores discussion or updates for a ticket.
4. `TicketAttachment`
   Stores file metadata linked to a ticket.

## Folder Structure

```text
ticket/
  controller/
  dto/
  entity/
  repository/
  service/
```

## Entity Layer

These classes define the database structure using JPA annotations.

### `entity/Ticket.java`

Represents the main maintenance ticket.

- Table: `tickets`
- Links to a `Resource`
- Links to the reporting `User`
- Stores category, priority, description, status, preferred contact
- Manages `createdAt` and `updatedAt` automatically

### `entity/TicketAssignment.java`

Represents technician assignment records.

- Table: `ticket_assignments`
- Links to a `Ticket`
- Links to the assigned technician
- Links to the user who made the assignment
- Stores `assignedAt`

### `entity/TicketComment.java`

Represents comments added to a ticket.

- Table: `comments`
- Links to a `Ticket`
- Links to a `User`
- Stores comment content
- Manages `createdAt` and `updatedAt`

### `entity/TicketAttachment.java`

Represents uploaded file metadata for a ticket.

- Table: `attachments`
- Links to a `Ticket`
- Stores file name, file URL, file type, file size
- Stores `uploadedAt`

## DTO Layer

These classes are used to keep API request and response objects separate from entity classes.

### Ticket DTOs

### `dto/TicketCreateDTO.java`

Used when creating a new ticket.

- `resourceId`
- `reportedById`
- `category`
- `priority`
- `description`
- `preferredContact`

### `dto/TicketUpdateDTO.java`

Used when updating an existing ticket.

- `category`
- `priority`
- `description`
- `status`
- `preferredContact`

### `dto/TicketResponseDTO.java`

Prepared for returning cleaned ticket response data.

- Includes ticket IDs and names for related resource and reporter
- Includes ticket details and timestamps

Note:
The current controllers return entities directly. This response DTO is ready if later want to map responses more cleanly.

### Assignment DTOs

### `dto/TicketAssignmentCreateDTO.java`

Used when assigning a technician to a ticket.

- `ticketId`
- `technicianId`
- `assignedById`

### `dto/TicketAssignmentResponseDTO.java`

Prepared for returning assignment details in a cleaner API response.

- Includes ticket ID
- Includes technician and assigner IDs and names
- Includes assignment timestamp

### Comment DTOs

### `dto/TicketCommentCreateDTO.java`

Used when adding a new ticket comment.

- `ticketId`
- `userId`
- `content`

### `dto/TicketCommentUpdateDTO.java`

Used when editing a comment.

- `content`

### `dto/TicketCommentResponseDTO.java`

Prepared for returning comment details with user name and timestamps.

### Attachment DTOs

### `dto/TicketAttachmentCreateDTO.java`

Used when adding attachment metadata to a ticket.

- `ticketId`
- `fileName`
- `fileUrl`
- `fileType`
- `fileSize`

### `dto/TicketAttachmentResponseDTO.java`

Prepared for returning attachment details in a response-friendly format.

## Repository Layer

These interfaces handle database access using Spring Data JPA.

### `repository/TicketRepository.java`

Main repository for `Ticket`.

Custom query support includes:

- find tickets by reporter
- find tickets by resource
- find tickets by status
- find tickets by priority
- find tickets by category

### `repository/TicketAssignmentRepository.java`

Handles assignment lookups.

- find assignments by ticket
- find assignments by technician

### `repository/TicketCommentRepository.java`

Handles comment lookups.

- find comments by ticket
- returns comments ordered by creation time

### `repository/TicketAttachmentRepository.java`

Handles attachment lookups.

- find attachments by ticket

## Service Layer

These classes contain the business logic.

### `service/TicketService.java`

Main service for ticket management.

Responsibilities:

- create tickets
- validate required ticket input
- update tickets
- fetch tickets by different filters
- delete tickets
- update ticket status internally

Important behavior:

- newly created tickets start with status `OPEN`

### `service/TicketAssignmentService.java`

Handles technician assignment logic.

Responsibilities:

- assign technician to a ticket
- fetch assignments by ticket
- fetch assignments by technician
- delete assignments

Important behavior:

- if a ticket is `OPEN`, adding an assignment changes it to `IN_PROGRESS`

### `service/TicketCommentService.java`

Handles comment operations.

Responsibilities:

- add a comment
- update a comment
- list comments for a ticket
- delete a comment

### `service/TicketAttachmentService.java`

Handles attachment metadata operations.

Responsibilities:

- add attachment metadata
- list attachments for a ticket
- delete attachment metadata

## Controller Layer

These classes expose REST endpoints.

### `controller/TicketController.java`

Main API controller for tickets.

Endpoints include:

- create ticket
- update ticket
- get all tickets
- get ticket by ID
- get tickets by reporter
- get tickets by resource
- get tickets by status
- get tickets by priority
- delete ticket

Base path:

```text
/api/tickets
```

### `controller/TicketAssignmentController.java`

API controller for technician assignments.

Endpoints include:

- create assignment
- get assignments by ticket
- get assignments by technician
- delete assignment

Base path:

```text
/api/ticket-assignments
```

### `controller/TicketCommentController.java`

API controller for comments.

Endpoints include:

- create comment
- update comment
- get comments by ticket
- delete comment

Base path:

```text
/api/ticket-comments
```

### `controller/TicketAttachmentController.java`

API controller for attachments.

Endpoints include:

- create attachment
- get attachments by ticket
- delete attachment

Base path:

```text
/api/ticket-attachments
```

## Request Flow

Typical flow inside this module:

1. Controller receives HTTP request.
2. DTO captures request body data.
3. Service validates and applies business rules.
4. Repository saves or fetches data.
5. Entity is returned to the controller.
6. Controller wraps the result in a response map.

## Notes

- The `.gitkeep` files exist only to preserve empty folders when needed.

