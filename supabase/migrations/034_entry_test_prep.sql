-- Entry test preparation: add is_entry_test flag to notes
alter table notes add column if not exists is_entry_test boolean not null default false;
create index if not exists notes_entry_test_idx on notes(is_entry_test, category, created_at desc);
