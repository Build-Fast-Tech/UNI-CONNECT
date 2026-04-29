-- ── Coding OS Module ─────────────────────────────────────────────

-- Problems library
create table if not exists coding_problems (
  id            uuid primary key default gen_random_uuid(),
  track         text not null check (track in ('fundamentals','oop','dsa')),
  title         text not null,
  description   text not null,
  difficulty    text not null check (difficulty in ('easy','medium','hard')),
  starter_code  text not null default '',
  test_cases    jsonb not null default '[]',
  hints         jsonb not null default '[]',
  points        int  not null default 10,
  tags          text[] not null default '{}',
  created_at    timestamptz not null default now()
);

-- User code submissions
create table if not exists coding_submissions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  problem_id       uuid not null references coding_problems(id) on delete cascade,
  code             text not null,
  language         text not null default 'cpp',
  status           text not null check (status in ('accepted','wrong_answer','error','timeout','pending')),
  output           text,
  error_log        text,
  points_earned    int not null default 0,
  execution_time_ms int,
  submitted_at     timestamptz not null default now()
);

-- Dry run attempts
create table if not exists coding_dry_runs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  code_snippet     text not null,
  user_prediction  text not null,
  correct_output   text not null,
  is_correct       boolean not null,
  points_earned    int not null default 0,
  track            text not null default 'fundamentals',
  difficulty       text not null default 'easy',
  created_at       timestamptz not null default now()
);

-- Battle rooms
create table if not exists battle_rooms (
  id                  uuid primary key default gen_random_uuid(),
  creator_id          uuid not null references profiles(id) on delete cascade,
  topic               text not null,
  difficulty          text not null check (difficulty in ('easy','medium','hard')),
  language            text not null default 'cpp',
  duration_minutes    int not null default 30,
  max_players         int not null default 4,
  problem_title       text,
  problem_description text,
  starter_code        text,
  test_cases          jsonb default '[]',
  custom_instructions text,
  status              text not null default 'waiting' check (status in ('waiting','active','finished')),
  starts_at           timestamptz,
  ends_at             timestamptz,
  created_at          timestamptz not null default now()
);

-- Battle room participants
create table if not exists battle_participants (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references battle_rooms(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  code       text default '',
  status     text not null default 'waiting' check (status in ('waiting','coding','submitted','finished')),
  score      int not null default 0,
  rank       int,
  joined_at  timestamptz not null default now(),
  unique(room_id, user_id)
);

-- ── RLS ─────────────────────────────────────────────────────────
alter table coding_problems     enable row level security;
alter table coding_submissions  enable row level security;
alter table coding_dry_runs     enable row level security;
alter table battle_rooms        enable row level security;
alter table battle_participants enable row level security;

create policy "problems_public_read"  on coding_problems     for select using (true);
create policy "problems_admin_write"  on coding_problems     for all    using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "submissions_insert"    on coding_submissions  for insert with check (auth.uid() = user_id);
create policy "submissions_own_read"  on coding_submissions  for select using (auth.uid() = user_id);

create policy "dryruns_insert"        on coding_dry_runs     for insert with check (auth.uid() = user_id);
create policy "dryruns_own_read"      on coding_dry_runs     for select using (auth.uid() = user_id);

create policy "battle_rooms_read"     on battle_rooms        for select using (true);
create policy "battle_rooms_insert"   on battle_rooms        for insert with check (auth.uid() = creator_id);
create policy "battle_rooms_update"   on battle_rooms        for update using (auth.uid() = creator_id);

create policy "battle_parts_read"     on battle_participants for select using (true);
create policy "battle_parts_insert"   on battle_participants for insert with check (auth.uid() = user_id);
create policy "battle_parts_update"   on battle_participants for update using (auth.uid() = user_id);

-- ── Realtime ─────────────────────────────────────────────────────
alter publication supabase_realtime add table battle_rooms;
alter publication supabase_realtime add table battle_participants;

-- ── Indexes ─────────────────────────────────────────────────────
create index if not exists coding_problems_track_idx     on coding_problems(track, difficulty);
create index if not exists coding_submissions_user_idx   on coding_submissions(user_id, submitted_at desc);
create index if not exists coding_submissions_problem_idx on coding_submissions(problem_id, status);
create index if not exists battle_rooms_status_idx        on battle_rooms(status, created_at desc);
