create table if not exists suggestions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete set null,
  type       text not null default 'suggestion'
               check (type in ('suggestion', 'bug', 'feature', 'other')),
  message    text not null,
  created_at timestamptz not null default now()
);

alter table suggestions enable row level security;

create policy "suggestions_insert_auth"
  on suggestions for insert
  with check (auth.role() = 'authenticated');

create policy "suggestions_read_own"
  on suggestions for select
  using (user_id = auth.uid());
