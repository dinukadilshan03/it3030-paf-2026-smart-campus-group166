# PAF System – Database Design

## Overview

This document defines the relational database schema for the PAF system.
It is designed for compatibility with **Spring Boot + JPA + PostgreSQL/MySQL**.

---

## Entities

* User
* Role
* Resource
* ResourceType
* Booking
* Ticket
* TicketAssignment
* Comment
* Notification
* Attachment

---

## 1. Role Table

Defines system roles.

```sql
Table: roles

role_id      BIGINT (PK)
role_name    VARCHAR(50) UNIQUE
description  TEXT
created_at   TIMESTAMP
```

**Example Roles**

* ADMIN
* USER
* TECHNICIAN

---

## 2. User Table

Stores system users.

```sql
Table: users

user_id        BIGINT (PK)
name           VARCHAR(120)
email          VARCHAR(120) UNIQUE
role_id        BIGINT (FK → roles.role_id)
department     VARCHAR(120)
phone          VARCHAR(30)
oauth_provider VARCHAR(50)
oauth_id       VARCHAR(120)
status         VARCHAR(20)
created_at     TIMESTAMP
updated_at     TIMESTAMP
```

**Relationship**

```
users.role_id → roles.role_id
```

---

## 3. ResourceType Table

Defines categories of resources.

```sql
Table: resource_types

type_id     BIGINT (PK)
type_name   VARCHAR(100)
category    VARCHAR(100)
description TEXT
```

**Examples**

* LECTURE_HALL (FACILITY)
* LAB (FACILITY)
* PROJECTOR (EQUIPMENT)
* CAMERA (EQUIPMENT)

---

## 4. Resource Table

Represents actual resources.

```sql
Table: resources

resource_id  BIGINT (PK)
name         VARCHAR(150)
type_id      BIGINT (FK → resource_types.type_id)
location     VARCHAR(200)
capacity     INT
status       VARCHAR(30)
description  TEXT
created_at   TIMESTAMP
updated_at   TIMESTAMP
```

**Relationship**

```
resources.type_id → resource_types.type_id
```

---

## 5. Booking Table

Handles reservations.

```sql
Table: bookings

booking_id          BIGINT (PK)
resource_id         BIGINT (FK → resources.resource_id)
user_id             BIGINT (FK → users.user_id)
start_time          TIMESTAMP
end_time            TIMESTAMP
purpose             TEXT
expected_attendees  INT
status              VARCHAR(30)
approval_reason     TEXT
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

**Statuses**

* PENDING
* APPROVED
* REJECTED
* CANCELLED

**Relationships**

```
bookings.resource_id → resources.resource_id
bookings.user_id → users.user_id
```

---

## 6. Ticket Table

Maintenance/incident tracking.

```sql
Table: tickets

ticket_id         BIGINT (PK)
resource_id       BIGINT (FK → resources.resource_id)
reported_by       BIGINT (FK → users.user_id)
category          VARCHAR(100)
priority          VARCHAR(20)
description       TEXT
status            VARCHAR(30)
preferred_contact VARCHAR(120)
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

**Statuses**

* OPEN
* IN_PROGRESS
* RESOLVED
* CLOSED
* REJECTED

---

## 7. TicketAssignment Table

Tracks technician assignments.

```sql
Table: ticket_assignments

assignment_id  BIGINT (PK)
ticket_id      BIGINT (FK → tickets.ticket_id)
technician_id  BIGINT (FK → users.user_id)
assigned_by    BIGINT (FK → users.user_id)
assigned_at    TIMESTAMP
```

---

## 8. Comment Table

Stores ticket discussions.

```sql
Table: comments

comment_id  BIGINT (PK)
ticket_id   BIGINT (FK → tickets.ticket_id)
user_id     BIGINT (FK → users.user_id)
content     TEXT
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

---

## 9. Notification Table

Stores system notifications.

```sql
Table: notifications

notification_id BIGINT (PK)
user_id         BIGINT (FK → users.user_id)
type            VARCHAR(50)
message         TEXT
reference_id    BIGINT
is_read         BOOLEAN
created_at      TIMESTAMP
```

**Examples**

* BOOKING_APPROVED
* BOOKING_REJECTED
* TICKET_STATUS_UPDATE
* NEW_COMMENT

---

## 10. Attachment Table

Stores files for tickets.

```sql
Table: attachments

attachment_id BIGINT (PK)
ticket_id     BIGINT (FK → tickets.ticket_id)
file_name     VARCHAR(200)
file_url      VARCHAR(300)
file_type     VARCHAR(50)
file_size     BIGINT
uploaded_at   TIMESTAMP
```

---

# System Relationships (High-Level)

```
Role
 └── User
      ├── Booking
      ├── Ticket
      │    ├── Comment
      │    ├── Attachment
      │    └── TicketAssignment
      └── Notification

ResourceType
 └── Resource
      ├── Booking
      └── Ticket
```

---

# Module Ownership (Team Split)

## Member 1 – Facilities & Assets

* Resource
* ResourceType

## Member 2 – Booking Management

* Booking

## Member 3 – Maintenance & Ticketing

* Ticket
* TicketAssignment
* Comment
* Attachment

## Member 4 – Auth & Notifications

* User
* Role
* Notification

---

# Notes for Implementation

* Use **JPA relationships** (`@ManyToOne`, `@OneToMany`) to map foreign keys
* Enforce **unique constraints** (email, role_name)
* Add **indexes** on:

  * `resource_id`
  * `user_id`
  * `ticket_id`
* Consider using **ENUMs** for status fields in code layer

