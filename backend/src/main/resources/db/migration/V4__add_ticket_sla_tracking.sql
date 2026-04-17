alter table tickets
    add column if not exists first_responded_at timestamp;
