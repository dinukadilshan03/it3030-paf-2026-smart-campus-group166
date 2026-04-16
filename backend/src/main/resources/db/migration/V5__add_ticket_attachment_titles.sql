alter table ticket_attachments
    add column if not exists title varchar(160);

update ticket_attachments
set title = file_name
where title is null;

alter table ticket_attachments
    alter column title set not null;
