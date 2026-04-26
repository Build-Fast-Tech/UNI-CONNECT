-- Study Groups: permanent and temporary public groups for collaborative studying
create table if not exists public.study_groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  type         text not null default 'permanent' check (type in ('permanent', 'temporary')),
  subject      text not null default 'General',
  creator_id   uuid references public.profiles(id) on delete cascade not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz
);

alter table public.study_groups enable row level security;

create policy "Anyone authenticated can view active study groups"
  on public.study_groups for select
  using (auth.role() = 'authenticated' and is_active = true);

create policy "Authenticated users can create study groups"
  on public.study_groups for insert
  with check (auth.uid() = creator_id);

create policy "Creators can update their study groups"
  on public.study_groups for update
  using (auth.uid() = creator_id);

create index if not exists idx_study_groups_active
  on public.study_groups(is_active, created_at desc);
