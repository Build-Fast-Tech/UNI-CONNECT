-- UniConnect Initial Schema
-- Run this in Supabase SQL Editor or via: supabase db push

-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

-- ─── Universities ─────────────────────────────────────────────────────────────
create table if not exists universities (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  short_name      text not null,
  slug            text unique not null,
  city            text,
  province        text,
  logo_url        text,
  cover_url       text,
  website         text,
  founding_year   int,
  total_students  int,
  is_featured     boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ─── Branches (campuses) ──────────────────────────────────────────────────────
create table if not exists branches (
  id             uuid primary key default gen_random_uuid(),
  university_id  uuid not null references universities(id) on delete cascade,
  name           text not null,
  slug           text,
  city           text,
  created_at     timestamptz not null default now()
);

-- ─── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  full_name        text not null,
  username         text unique,
  email            text not null,
  avatar_url       text,
  bio              text,
  role             text not null default 'student'
                     check (role in ('student','employer','moderator','admin')),
  status           text not null default 'active'
                     check (status in ('active','suspended','banned')),
  university_id    uuid references universities(id),
  branch_id        uuid references branches(id),
  department       text,
  year_of_study    int,
  cgpa             numeric(3,2),
  graduation_year  int,
  linkedin         text,
  github           text,
  portfolio_url    text,
  theme            text not null default 'midnight',
  is_verified      boolean not null default false,
  last_active_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ─── Channels ─────────────────────────────────────────────────────────────────
create table if not exists channels (
  id             uuid primary key default gen_random_uuid(),
  type           text not null check (type in ('global','university','branch','dm')),
  university_id  uuid references universities(id),
  branch_id      uuid references branches(id),
  dm_user_a      uuid references profiles(id),
  dm_user_b      uuid references profiles(id),
  name           text,
  created_at     timestamptz not null default now()
);

-- Seed the single global channel
insert into channels (type, name)
values ('global', 'All-Pakistan Chat')
on conflict do nothing;

-- ─── Messages ─────────────────────────────────────────────────────────────────
create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  channel_id  uuid not null references channels(id) on delete cascade,
  sender_id   uuid not null references profiles(id),
  content     text,
  attachments jsonb not null default '[]',
  reply_to    uuid references messages(id),
  is_pinned   boolean not null default false,
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ─── Notes ────────────────────────────────────────────────────────────────────
create table if not exists notes (
  id               uuid primary key default gen_random_uuid(),
  uploader_id      uuid not null references profiles(id),
  title            text not null,
  description      text,
  subject          text not null,
  course_code      text,
  semester         text,
  university_id    uuid references universities(id),
  file_url         text not null,
  file_type        text,
  file_size_bytes  bigint,
  thumbnail_url    text,
  ocr_text         text,
  tsv              tsvector generated always as (
                     to_tsvector('english',
                       coalesce(title,'') || ' ' ||
                       coalesce(description,'') || ' ' ||
                       coalesce(subject,'') || ' ' ||
                       coalesce(course_code,'') || ' ' ||
                       coalesce(ocr_text,''))
                   ) stored,
  upvotes          int not null default 0,
  downvotes        int not null default 0,
  downloads        int not null default 0,
  status           text not null default 'published'
                     check (status in ('published','flagged','removed')),
  created_at       timestamptz not null default now()
);

-- ─── Jobs ─────────────────────────────────────────────────────────────────────
create table if not exists jobs (
  id                    uuid primary key default gen_random_uuid(),
  employer_id           uuid not null references profiles(id),
  title                 text not null,
  company_name          text not null,
  company_logo_url      text,
  type                  text not null
                          check (type in ('internship','full_time','part_time','contract','remote')),
  city                  text,
  is_remote             boolean not null default false,
  experience_required   text,
  salary_min            int,
  salary_max            int,
  currency              text not null default 'PKR',
  preferred_universities uuid[] not null default '{}',
  required_skills       text[] not null default '{}',
  description           text,
  apply_method          text not null
                          check (apply_method in ('email','url','platform')),
  apply_value           text,
  deadline              date,
  is_featured           boolean not null default false,
  status                text not null default 'active'
                          check (status in ('active','closed','removed','pending')),
  created_at            timestamptz not null default now()
);

-- ─── CVs ──────────────────────────────────────────────────────────────────────
create table if not exists cvs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  file_url         text,
  headline         text,
  skills           text[] not null default '{}',
  preferred_roles  text[] not null default '{}',
  preferred_cities text[] not null default '{}',
  availability     text,
  visibility       text not null default 'employers_only'
                     check (visibility in ('public','employers_only','private')),
  views            int not null default 0,
  created_at       timestamptz not null default now()
);

-- ─── Job Applications ─────────────────────────────────────────────────────────
create table if not exists job_applications (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references jobs(id) on delete cascade,
  applicant_id  uuid not null references profiles(id),
  cv_id         uuid references cvs(id),
  cover_note    text,
  status        text not null default 'applied'
                  check (status in ('applied','viewed','shortlisted','rejected','hired')),
  created_at    timestamptz not null default now(),
  unique(job_id, applicant_id)
);

-- ─── AI Conversations ─────────────────────────────────────────────────────────
create table if not exists ai_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text,
  mode        text not null default 'study_buddy',
  context     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create table if not exists ai_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references ai_conversations(id) on delete cascade,
  role             text not null check (role in ('user','assistant','system')),
  content          text not null,
  tokens           int,
  created_at       timestamptz not null default now()
);

-- ─── Supporting Tables ────────────────────────────────────────────────────────
create table if not exists bookmarks (
  user_id     uuid not null references profiles(id) on delete cascade,
  note_id     uuid not null references notes(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, note_id)
);

create table if not exists votes (
  user_id   uuid not null references profiles(id) on delete cascade,
  note_id   uuid not null references notes(id) on delete cascade,
  vote      int not null check (vote in (-1, 1)),
  primary key (user_id, note_id)
);

create table if not exists reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references profiles(id),
  target_type  text not null,
  target_id    uuid not null,
  reason       text not null,
  status       text not null default 'pending',
  handled_by   uuid references profiles(id),
  resolved_at  timestamptz,
  created_at   timestamptz not null default now()
);

create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        text not null,
  payload     jsonb not null default '{}',
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists audit_logs (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid not null references profiles(id),
  action       text not null,
  target_type  text,
  target_id    uuid,
  meta         jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

create table if not exists subjects (
  id      uuid primary key default gen_random_uuid(),
  name    text not null unique,
  faculty text
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists notes_tsv_idx        on notes using gin(tsv);
create index if not exists notes_subject_idx    on notes(subject, created_at desc);
create index if not exists notes_uni_idx        on notes(university_id, created_at desc);
create index if not exists messages_channel_idx on messages(channel_id, created_at desc);
create index if not exists jobs_status_idx      on jobs(status, created_at desc);
create index if not exists jobs_skills_idx      on jobs using gin(required_skills);
create index if not exists jobs_unis_idx        on jobs using gin(preferred_universities);
create index if not exists profiles_name_idx    on profiles using gin(full_name gin_trgm_ops);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table profiles        enable row level security;
alter table universities    enable row level security;
alter table branches        enable row level security;
alter table channels        enable row level security;
alter table messages        enable row level security;
alter table notes           enable row level security;
alter table jobs            enable row level security;
alter table cvs             enable row level security;
alter table job_applications enable row level security;
alter table ai_conversations enable row level security;
alter table ai_messages     enable row level security;
alter table bookmarks       enable row level security;
alter table votes           enable row level security;
alter table reports         enable row level security;
alter table notifications   enable row level security;

-- Universities: public read
create policy "uni_read_all"
  on universities for select using (true);

-- Branches: public read
create policy "branches_read_all"
  on branches for select using (true);

-- Profiles: authenticated read all; own update
create policy "profiles_read_all"
  on profiles for select using (auth.role() = 'authenticated');

create policy "profiles_insert_own"
  on profiles for insert with check (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update using (auth.uid() = id);

create policy "profiles_delete_own"
  on profiles for delete using (auth.uid() = id);

-- Notes: read published; own insert/update/delete
create policy "notes_read_published"
  on notes for select
  using (status = 'published' or uploader_id = auth.uid());

create policy "notes_insert_own"
  on notes for insert with check (uploader_id = auth.uid());

create policy "notes_update_own"
  on notes for update using (uploader_id = auth.uid());

create policy "notes_delete_own"
  on notes for delete using (uploader_id = auth.uid());

-- Messages: global channel readable by all auth; others by channel membership
create policy "messages_read"
  on messages for select using (
    exists (
      select 1 from channels c
      where c.id = messages.channel_id
        and (c.type = 'global' or c.dm_user_a = auth.uid() or c.dm_user_b = auth.uid())
    )
    or exists (
      select 1 from profiles p
      join channels c on c.id = messages.channel_id
      where p.id = auth.uid()
        and (
          (c.type = 'university' and p.university_id = c.university_id)
          or (c.type = 'branch' and p.branch_id = c.branch_id)
        )
    )
  );

create policy "messages_insert_own"
  on messages for insert with check (sender_id = auth.uid());

create policy "messages_update_own"
  on messages for update using (sender_id = auth.uid());

-- Channels: authenticated read
create policy "channels_read"
  on channels for select using (auth.role() = 'authenticated');

-- Jobs: read active; employers insert own; update own
create policy "jobs_read_active"
  on jobs for select using (status = 'active' or employer_id = auth.uid());

create policy "jobs_insert_employer"
  on jobs for insert with check (employer_id = auth.uid());

create policy "jobs_update_own"
  on jobs for update using (employer_id = auth.uid());

-- CVs: read by owner or employers
create policy "cvs_read"
  on cvs for select using (
    user_id = auth.uid()
    or (
      visibility in ('public', 'employers_only')
      and exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('employer','admin'))
    )
  );

create policy "cvs_insert_own"
  on cvs for insert with check (user_id = auth.uid());

create policy "cvs_update_own"
  on cvs for update using (user_id = auth.uid());

-- Job Applications: own read/insert
create policy "applications_read_own"
  on job_applications for select
  using (applicant_id = auth.uid() or exists (
    select 1 from jobs j where j.id = job_id and j.employer_id = auth.uid()
  ));

create policy "applications_insert_own"
  on job_applications for insert with check (applicant_id = auth.uid());

-- AI: own read/insert
create policy "ai_conv_own"
  on ai_conversations for all using (user_id = auth.uid());

create policy "ai_msg_own"
  on ai_messages for all using (
    exists (select 1 from ai_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

-- Bookmarks / votes: own
create policy "bookmarks_own"  on bookmarks for all using (user_id = auth.uid());
create policy "votes_own"      on votes      for all using (user_id = auth.uid());

-- Notifications: own read
create policy "notif_own"
  on notifications for select using (user_id = auth.uid());

-- Reports: insert by auth
create policy "reports_insert"
  on reports for insert with check (reporter_id = auth.uid());

-- ─── Trigger: auto-create profile on signup ───────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Trigger: updated_at on profiles ─────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure public.set_updated_at();

-- ─── Function: AI rate limiting (50/day free) ─────────────────────────────────
create or replace function public.can_send_ai_message(uid uuid)
returns boolean language plpgsql security definer as $$
declare
  msg_count int;
  user_role text;
begin
  select role into user_role from profiles where id = uid;
  -- Admins and pro users (future) get unlimited
  if user_role in ('admin', 'moderator') then return true; end if;

  select count(*) into msg_count
  from ai_messages am
  join ai_conversations ac on ac.id = am.conversation_id
  where ac.user_id = uid
    and am.role = 'user'
    and am.created_at > now() - interval '24 hours';

  return msg_count < 50;
end;
$$;

-- ─── Seed: set first admin ────────────────────────────────────────────────────
-- After deploying, run this to make yourself admin:
-- update profiles set role = 'admin' where email = 'abdullah.xf90@gmail.com';
