alter table notes
  add column if not exists category text not null default 'notes'
    check (category in ('notes', 'quiz', 'assignment', 'sessional', 'final', 'other'));

create index if not exists notes_category_idx on notes(category, created_at desc);
