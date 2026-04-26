-- Upgrade suggestions table to a full feedback management system
alter table public.suggestions
  add column if not exists title            text,
  add column if not exists status           text not null default 'pending'
    check (status in ('pending', 'solved', 'rejected')),
  add column if not exists rejection_reason text,
  add column if not exists updated_at       timestamptz default now();

-- Drop existing policies if they exist before recreating
do $$ begin
  drop policy if exists "Users can view own suggestions"  on public.suggestions;
  drop policy if exists "Admins can view all suggestions" on public.suggestions;
  drop policy if exists "Admins can update suggestions"   on public.suggestions;
end $$;

-- Allow users to read their own submissions
create policy "Users can view own suggestions"
  on public.suggestions for select
  using (auth.uid() = user_id);

-- Admins can view all submissions
create policy "Admins can view all suggestions"
  on public.suggestions for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update status and rejection reason
create policy "Admins can update suggestions"
  on public.suggestions for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Indexes for admin dashboard queries
create index if not exists idx_suggestions_status on public.suggestions(status, created_at desc);
create index if not exists idx_suggestions_user   on public.suggestions(user_id, created_at desc);
