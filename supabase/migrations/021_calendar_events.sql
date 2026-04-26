-- Calendar events: per-user schedule entries
create table if not exists public.calendar_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  title       text not null,
  description text,
  date        date not null,
  start_time  text,
  end_time    text,
  color       text not null default '#6366f1',
  created_at  timestamptz not null default now()
);

alter table public.calendar_events enable row level security;

create policy "Users can manage their own calendar events"
  on public.calendar_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_calendar_events_user_date
  on public.calendar_events(user_id, date);
