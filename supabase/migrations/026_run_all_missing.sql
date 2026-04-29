-- ============================================================
-- 026_run_all_missing.sql
-- Safe catch-up migration: runs 018 → 025 in one transaction.
-- Every statement uses IF NOT EXISTS / IF EXISTS so it is safe
-- to run even if some steps already exist.
-- Paste the entire file into Supabase SQL Editor → Run.
-- ============================================================

-- ── 018 · Societies, society_members, society_posts, personal_events ──────────

alter table profiles add column if not exists semester_end_date date;

create table if not exists public.societies (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  description    text,
  university_id  uuid references public.universities(id) on delete cascade,
  admin_id       uuid references public.profiles(id) on delete set null,
  official_email text,
  logo_url       text,
  cover_url      text,
  category       text not null default 'general'
                   check (category in ('academic','cultural','sports','tech','arts','community','general')),
  status         text not null default 'pending'
                   check (status in ('pending','approved','rejected','suspended')),
  member_count   int not null default 0,
  rejection_note text,
  reviewed_by    uuid references public.profiles(id) on delete set null,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);

alter table public.societies enable row level security;

drop policy if exists "societies_read_approved"           on public.societies;
drop policy if exists "societies_insert_any"              on public.societies;
drop policy if exists "societies_insert_authenticated"    on public.societies;
drop policy if exists "societies_update_admin_or_owner"   on public.societies;

create policy "societies_read_approved"
  on public.societies for select
  using (status = 'approved' or admin_id = auth.uid()
         or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "societies_insert_authenticated"
  on public.societies for insert
  with check (auth.uid() is not null and auth.uid() = admin_id);

create policy "societies_update_admin_or_owner"
  on public.societies for update
  using (admin_id = auth.uid()
         or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create table if not exists public.society_members (
  id          uuid primary key default gen_random_uuid(),
  society_id  uuid not null references public.societies(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null default 'member' check (role in ('member','moderator','creator')),
  joined_at   timestamptz not null default now(),
  unique(society_id, user_id)
);

alter table public.society_members enable row level security;

drop policy if exists "society_members_read_all"    on public.society_members;
drop policy if exists "society_members_insert_own"  on public.society_members;
drop policy if exists "society_members_delete_own"  on public.society_members;

create policy "society_members_read_all"
  on public.society_members for select using (auth.uid() is not null);

create policy "society_members_insert_own"
  on public.society_members for insert with check (user_id = auth.uid());

create policy "society_members_delete_own"
  on public.society_members for delete using (user_id = auth.uid());

create table if not exists public.society_posts (
  id          uuid primary key default gen_random_uuid(),
  society_id  uuid not null references public.societies(id) on delete cascade,
  author_id   uuid not null references public.profiles(id),
  title       text,
  content     text not null,
  type        text not null default 'post' check (type in ('post','event','announcement')),
  post_type   text not null default 'announcement' check (post_type in ('announcement','event','update')),
  event_date  timestamptz,
  image_url   text,
  likes       int not null default 0,
  is_pinned   boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.society_posts enable row level security;

drop policy if exists "society_posts_read"          on public.society_posts;
drop policy if exists "society_posts_insert_member" on public.society_posts;
drop policy if exists "society_posts_delete_author" on public.society_posts;

create policy "society_posts_read"
  on public.society_posts for select using (
    exists (select 1 from public.societies s where s.id = society_id and s.status = 'approved')
  );

create policy "society_posts_insert_member"
  on public.society_posts for insert with check (
    author_id = auth.uid()
    and exists (select 1 from public.society_members where society_id = society_posts.society_id and user_id = auth.uid())
  );

create policy "society_posts_delete_author"
  on public.society_posts for delete using (author_id = auth.uid());

create table if not exists public.personal_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  event_date  timestamptz not null,
  color       text not null default '#6366f1',
  notify_before_minutes int not null default 30,
  created_at  timestamptz not null default now()
);

alter table public.personal_events enable row level security;

drop policy if exists "personal_events_owner" on public.personal_events;

create policy "personal_events_owner"
  on public.personal_events
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

do $$ begin
  begin alter table public.societies replica identity full; exception when others then null; end;
  begin alter publication supabase_realtime add table public.societies; exception when others then null; end;
  begin alter table public.society_posts replica identity full; exception when others then null; end;
  begin alter publication supabase_realtime add table public.society_posts; exception when others then null; end;
end $$;

create index if not exists societies_uni_idx       on public.societies(university_id, status);
create index if not exists societies_status_idx    on public.societies(status);
create index if not exists society_posts_soc_idx   on public.society_posts(society_id, created_at desc);
create index if not exists personal_events_usr_idx on public.personal_events(user_id, event_date);

-- ── 019 · user_subjects, study_logs, tasks, gpa_assignments ──────────────────

create table if not exists public.user_subjects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  color         text not null default '#6366f1',
  target_grade  numeric(4,1),
  current_grade numeric(4,1),
  credits       int not null default 3,
  created_at    timestamptz not null default now(),
  unique(user_id, name)
);

alter table public.user_subjects enable row level security;

drop policy if exists "user_subjects_owner"  on public.user_subjects;
drop policy if exists "user_subjects_select" on public.user_subjects;
drop policy if exists "user_subjects_insert" on public.user_subjects;
drop policy if exists "user_subjects_update" on public.user_subjects;
drop policy if exists "user_subjects_delete" on public.user_subjects;

create policy "user_subjects_select" on public.user_subjects for select using (user_id = auth.uid());
create policy "user_subjects_insert" on public.user_subjects for insert with check (user_id = auth.uid());
create policy "user_subjects_update" on public.user_subjects for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "user_subjects_delete" on public.user_subjects for delete using (user_id = auth.uid());

create table if not exists public.study_logs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  subject_id       uuid references public.user_subjects(id) on delete set null,
  duration_minutes int not null check (duration_minutes > 0),
  timestamp        timestamptz not null default now(),
  is_group_session boolean not null default false,
  session_code     text,
  notes            text,
  created_at       timestamptz not null default now()
);

alter table public.study_logs enable row level security;

drop policy if exists "study_logs_owner"       on public.study_logs;
drop policy if exists "study_logs_public_read" on public.study_logs;

create policy "study_logs_owner"       on public.study_logs for all   using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "study_logs_public_read" on public.study_logs for select using (true);

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  due_date    timestamptz,
  subject_id  uuid references public.user_subjects(id) on delete set null,
  completed   boolean not null default false,
  priority    text not null default 'medium' check (priority in ('low','medium','high')),
  created_at  timestamptz not null default now()
);

alter table public.tasks enable row level security;

drop policy if exists "tasks_owner" on public.tasks;
create policy "tasks_owner" on public.tasks using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.gpa_assignments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  subject_id   uuid not null references public.user_subjects(id) on delete cascade,
  name         text not null,
  grade        numeric(5,2) not null,
  max_grade    numeric(5,2) not null default 100,
  weight       numeric(5,2) not null default 100,
  created_at   timestamptz not null default now()
);

alter table public.gpa_assignments enable row level security;

drop policy if exists "gpa_assignments_owner" on public.gpa_assignments;
create policy "gpa_assignments_owner" on public.gpa_assignments using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.profiles add column if not exists total_hours_studied int not null default 0;
alter table public.profiles add column if not exists gpa_scale text not null default 'percent';

create index if not exists study_logs_user_ts on public.study_logs(user_id, timestamp desc);
create index if not exists study_logs_subj    on public.study_logs(subject_id);

do $$ begin
  begin alter publication supabase_realtime add table public.study_logs; exception when others then null; end;
  begin alter publication supabase_realtime add table public.tasks; exception when others then null; end;
end $$;

-- ── 020 · study_groups ───────────────────────────────────────────────────────

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

drop policy if exists "Anyone authenticated can view active study groups" on public.study_groups;
drop policy if exists "Authenticated users can create study groups"       on public.study_groups;
drop policy if exists "Creators can update their study groups"            on public.study_groups;

create policy "Anyone authenticated can view active study groups"
  on public.study_groups for select using (auth.uid() is not null and is_active = true);

create policy "Authenticated users can create study groups"
  on public.study_groups for insert with check (auth.uid() = creator_id);

create policy "Creators can update their study groups"
  on public.study_groups for update using (auth.uid() = creator_id);

create index if not exists idx_study_groups_active on public.study_groups(is_active, created_at desc);

-- ── 021a · calendar_events ───────────────────────────────────────────────────

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

drop policy if exists "Users can manage their own calendar events" on public.calendar_events;

create policy "Users can manage their own calendar events"
  on public.calendar_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_calendar_events_user_date on public.calendar_events(user_id, date);

-- ── 021b · employer rejection_reason ─────────────────────────────────────────

alter table public.employer_applications add column if not exists rejection_reason text;

-- ── 022 · messages reply threading + media ───────────────────────────────────

alter table public.messages
  add column if not exists reply_to_id uuid references public.messages(id) on delete set null,
  add column if not exists gif_url     text,
  add column if not exists sticker_id  text;

create index if not exists idx_messages_reply_to on public.messages(reply_to_id);

-- ── 023 · feedback management (suggestions upgrade) ──────────────────────────

alter table public.suggestions
  add column if not exists title            text,
  add column if not exists status           text not null default 'pending'
    check (status in ('pending', 'solved', 'rejected')),
  add column if not exists rejection_reason text,
  add column if not exists updated_at       timestamptz default now();

drop policy if exists "Users can view own suggestions"  on public.suggestions;
drop policy if exists "Admins can view all suggestions" on public.suggestions;
drop policy if exists "Admins can update suggestions"   on public.suggestions;

create policy "Users can view own suggestions"
  on public.suggestions for select using (auth.uid() = user_id);

create policy "Admins can view all suggestions"
  on public.suggestions for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update suggestions"
  on public.suggestions for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create index if not exists idx_suggestions_status on public.suggestions(status, created_at desc);
create index if not exists idx_suggestions_user   on public.suggestions(user_id, created_at desc);

-- ── 024 · society_followers + society_posts (follow/feed) ────────────────────

create table if not exists public.society_followers (
  user_id    uuid references public.profiles(id) on delete cascade,
  society_id uuid references public.societies(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, society_id)
);

alter table public.society_followers enable row level security;

drop policy if exists "Users manage own follows"        on public.society_followers;
drop policy if exists "Anyone can view follower counts" on public.society_followers;

create policy "Users manage own follows"        on public.society_followers for all    using (auth.uid() = user_id);
create policy "Anyone can view follower counts" on public.society_followers for select using (true);

alter table public.societies add column if not exists follower_count int4 not null default 0;

create or replace function public.sync_society_follower_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update public.societies set follower_count = follower_count + 1 where id = new.society_id;
  elsif tg_op = 'DELETE' then
    update public.societies set follower_count = greatest(0, follower_count - 1) where id = old.society_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_society_follower_count on public.society_followers;
create trigger trg_society_follower_count
  after insert or delete on public.society_followers
  for each row execute function public.sync_society_follower_count();

create index if not exists idx_society_posts_society   on public.society_posts(society_id, created_at desc);
create index if not exists idx_society_posts_feed      on public.society_posts(created_at desc);
create index if not exists idx_society_followers_user  on public.society_followers(user_id);
create index if not exists idx_society_followers_count on public.society_followers(society_id);

do $$ begin
  begin alter table public.society_followers replica identity full; exception when others then null; end;
  begin alter publication supabase_realtime add table public.society_followers; exception when others then null; end;
end $$;

-- ── 025 · fix societies INSERT RLS + suggestions updated_at ──────────────────
-- (already applied above in 018 section — included here for completeness)

alter table public.suggestions add column if not exists updated_at timestamptz default now();
