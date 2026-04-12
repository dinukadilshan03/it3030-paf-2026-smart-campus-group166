insert into roles (code, name, description)
values
    ('STUDENT', 'Student', 'Can browse resources, create bookings, create tickets, and receive notifications.'),
    ('STAFF', 'Staff', 'Can manage assigned tickets, add internal notes, and update ticket progress.'),
    ('ADMIN', 'Admin', 'Can manage resources, approve bookings, and oversee tickets and roles.')
on conflict (code) do update
set
    name = excluded.name,
    description = excluded.description;
