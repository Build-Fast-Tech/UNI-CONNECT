-- 018_societies_events.sql

-- ─── Fix user_subjects RLS (explicit per-operation policies) ─────────────────
drop policy if exists "user_subjects_owner" on user_subjects;

create policy "user_subjects_select" on user_subjects
  for select using (user_id = auth.uid());

create policy "user_subjects_insert" on user_subjects
  for insert with check (user_id = auth.uid());

create policy "user_subjects_update" on user_subjects
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "user_subjects_delete" on user_subjects
  for delete using (user_id = auth.uid());

-- ─── Semester end date on profiles ───────────────────────────────────────────
alter table profiles add column if not exists semester_end_date date;

-- ─── Societies ────────────────────────────────────────────────────────────────
create table if not exists societies (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  description    text,
  university_id  uuid references universities(id) on delete cascade,
  admin_id       uuid references profiles(id) on delete set null,
  official_email text,
  logo_url       text,
  cover_url      text,
  category       text not null default 'general'
                   check (category in ('academic','cultural','sports','tech','arts','community','general')),
  status         text not null default 'pending'
                   check (status in ('pending','approved','rejected','suspended')),
  member_count   int not null default 0,
  rejection_note text,
  reviewed_by    uuid references profiles(id) on delete set null,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);

alter table societies enable row level security;

create policy "societies_read_approved"
  on societies for select
  using (status = 'approved' or admin_id = auth.uid()
         or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "societies_insert_any"
  on societies for insert
  with check (auth.role() = 'authenticated');

create policy "societies_update_admin_or_owner"
  on societies for update
  using (admin_id = auth.uid()
         or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ─── Society Members ──────────────────────────────────────────────────────────
create table if not exists society_members (
  id          uuid primary key default gen_random_uuid(),
  society_id  uuid not null references societies(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  role        text not null default 'member' check (role in ('member','moderator','creator')),
  joined_at   timestamptz not null default now(),
  unique(society_id, user_id)
);

alter table society_members enable row level security;

create policy "society_members_read_all"
  on society_members for select using (auth.role() = 'authenticated');

create policy "society_members_insert_own"
  on society_members for insert with check (user_id = auth.uid());

create policy "society_members_delete_own"
  on society_members for delete using (user_id = auth.uid());

-- ─── Society Posts ────────────────────────────────────────────────────────────
create table if not exists society_posts (
  id          uuid primary key default gen_random_uuid(),
  society_id  uuid not null references societies(id) on delete cascade,
  author_id   uuid not null references profiles(id),
  title       text,
  content     text not null,
  type        text not null default 'post' check (type in ('post','event','announcement')),
  event_date  timestamptz,
  image_url   text,
  likes       int not null default 0,
  is_pinned   boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table society_posts enable row level security;

create policy "society_posts_read"
  on society_posts for select using (
    exists (
      select 1 from societies s where s.id = society_id and s.status = 'approved'
    )
  );

create policy "society_posts_insert_member"
  on society_posts for insert with check (
    author_id = auth.uid()
    and exists (select 1 from society_members where society_id = society_posts.society_id and user_id = auth.uid())
  );

create policy "society_posts_delete_author"
  on society_posts for delete using (author_id = auth.uid());

-- ─── Personal Events ──────────────────────────────────────────────────────────
create table if not exists personal_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null,
  description text,
  event_date  timestamptz not null,
  color       text not null default '#6366f1',
  notify_before_minutes int not null default 30,
  created_at  timestamptz not null default now()
);

alter table personal_events enable row level security;

create policy "personal_events_owner"
  on personal_events
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Realtime for societies ───────────────────────────────────────────────────
alter table societies replica identity full;
alter publication supabase_realtime add table societies;

alter table society_posts replica identity full;
alter publication supabase_realtime add table society_posts;

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists societies_uni_idx       on societies(university_id, status);
create index if not exists societies_status_idx    on societies(status);
create index if not exists society_posts_soc_idx   on society_posts(society_id, created_at desc);
create index if not exists personal_events_usr_idx on personal_events(user_id, event_date);
