-- University reviews (star rating + text) shown on the university detail page.
-- This table was previously applied only via the dashboard on the original
-- project and never captured as a migration; added here so the schema is
-- fully reproducible. Referenced by app/(app)/universities/[slug]/page.tsx.

create table if not exists public.university_reviews (
  id            uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  rating        int  not null check (rating between 1 and 5),
  review_text   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (university_id, user_id)
);

create index if not exists university_reviews_university_id_idx
  on public.university_reviews(university_id);

alter table public.university_reviews enable row level security;

drop policy if exists "university_reviews_public_read" on public.university_reviews;
create policy "university_reviews_public_read"
  on public.university_reviews for select using (true);

drop policy if exists "university_reviews_insert_own" on public.university_reviews;
create policy "university_reviews_insert_own"
  on public.university_reviews for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "university_reviews_update_own" on public.university_reviews;
create policy "university_reviews_update_own"
  on public.university_reviews for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "university_reviews_delete_own" on public.university_reviews;
create policy "university_reviews_delete_own"
  on public.university_reviews for delete to authenticated
  using (user_id = auth.uid());
