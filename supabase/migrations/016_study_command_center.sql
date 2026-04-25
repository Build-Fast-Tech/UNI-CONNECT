-- 016_study_command_center.sql
-- Study Command Center: user_subjects, study_logs, tasks, gpa_assignments

-- ─── User Subjects (each student's personal subject list) ─────────────────────
create table if not exists user_subjects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  name          text not null,
  color         text not null default '#6366f1',
  target_grade  numeric(4,1),
  current_grade numeric(4,1),
  credits       int not null default 3,
  created_at    timestamptz not null default now(),
  unique(user_id, name)
);

alter table user_subjects enable row level security;

create policy "user_subjects_owner" on user_subjects
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Study Logs ───────────────────────────────────────────────────────────────
create table if not exists study_logs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  subject_id       uuid references user_subjects(id) on delete set null,
  duration_minutes int not null check (duration_minutes > 0),
  timestamp        timestamptz not null default now(),
  is_group_session boolean not null default false,
  session_code     text,
  notes            text,
  created_at       timestamptz not null default now()
);

alter table study_logs enable row level security;

create policy "study_logs_owner" on study_logs
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "study_logs_public_read" on study_logs
  for select using (true);

-- ─── Tasks ───────────────────────────────────────────────────────────────────
create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null,
  description text,
  due_date    timestamptz,
  subject_id  uuid references user_subjects(id) on delete set null,
  completed   boolean not null default false,
  priority    text not null default 'medium' check (priority in ('low','medium','high')),
  created_at  timestamptz not null default now()
);

alter table tasks enable row level security;

create policy "tasks_owner" on tasks
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── GPA Assignments ─────────────────────────────────────────────────────────
create table if not exists gpa_assignments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  subject_id   uuid not null references user_subjects(id) on delete cascade,
  name         text not null,
  grade        numeric(5,2) not null,
  max_grade    numeric(5,2) not null default 100,
  weight       numeric(5,2) not null default 100,
  created_at   timestamptz not null default now()
);

alter table gpa_assignments enable row level security;

create policy "gpa_assignments_owner" on gpa_assignments
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Profile Updates ──────────────────────────────────────────────────────────
alter table profiles add column if not exists total_hours_studied int not null default 0;
alter table profiles add column if not exists gpa_scale text not null default 'percent';

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists study_logs_user_idx    on study_logs(user_id, timestamp desc);
create index if not exists study_logs_subject_idx on study_logs(subject_id);
create index if not exists study_logs_session_idx on study_logs(session_code) where session_code is not null;
create index if not exists tasks_user_idx         on tasks(user_id, due_date);
create index if not exists gpa_assignments_subj   on gpa_assignments(subject_id);

-- ─── Realtime ────────────────────────────────────────────────────────────────
alter table study_logs replica identity full;
alter publication supabase_realtime add table study_logs;

alter table tasks replica identity full;
alter publication supabase_realtime add table tasks;
