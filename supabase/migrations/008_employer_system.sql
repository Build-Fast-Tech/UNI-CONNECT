-- Employer applications table
create table if not exists employer_applications (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  email        text not null,
  company_name text not null,
  company_url  text,
  description  text,
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  user_id      uuid references profiles(id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);

alter table employer_applications enable row level security;

create policy "employer_apps_insert_any"
  on employer_applications for insert
  with check (true);

create policy "employer_apps_read_admin"
  on employer_applications for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    or user_id = auth.uid()
  );

create policy "employer_apps_update_admin"
  on employer_applications for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Fix jobs RLS: only employer or admin role can post
drop policy if exists "jobs_insert_employer" on jobs;
create policy "jobs_insert_employer"
  on jobs for insert
  with check (
    employer_id = auth.uid()
    and exists (
      select 1 from profiles where id = auth.uid() and role in ('employer', 'admin')
    )
  );
