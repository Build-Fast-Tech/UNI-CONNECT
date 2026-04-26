-- Upgrade suggestions table to a full feedback management system
alter table public.suggestions
  add column if not exists title           text,
  add column if not exists status          text not null default 'pending'
    check (status in ('pending', 'solved', 'rejected')),
  add column if not exists rejection_reason text,
  add column if not exists updated_at      timestamptz default now();

-- Allow users to read their own submissions
create policy if not exists "Users can view own suggestions"
  on public.suggestions for select
  using (auth.uid() = user_id);

-- Admins can view and update all
create policy if not exists "Admins can view all suggestions"
  on public.suggestions for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy if not exists "Admins can update suggestions"
  on public.suggestions for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Index for admin dashboard queries
create index if not exists idx_suggestions_status on public.suggestions(status, created_at desc);
create index if not exists idx_suggestions_user   on public.suggestions(user_id, created_at desc);
