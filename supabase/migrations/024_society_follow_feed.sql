-- Society followers (separate from "join" — follow = see posts in feed)
create table if not exists public.society_followers (
  user_id    uuid references public.profiles(id) on delete cascade,
  society_id uuid references public.societies(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, society_id)
);
alter table public.society_followers enable row level security;
create policy "Users manage own follows" on public.society_followers for all using (auth.uid() = user_id);
create policy "Anyone can view follower counts" on public.society_followers for select using (true);

-- Society posts (announcements, events, updates posted by society admins)
create table if not exists public.society_posts (
  id          uuid primary key default gen_random_uuid(),
  society_id  uuid references public.societies(id) on delete cascade not null,
  author_id   uuid references public.profiles(id) on delete cascade not null,
  title       text,
  content     text not null,
  image_url   text,
  event_date  timestamptz,
  post_type   text not null default 'announcement'
              check (post_type in ('announcement','event','update')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.society_posts enable row level security;

create policy "Anyone can view posts from approved societies" on public.society_posts
  for select using (
    exists (select 1 from public.societies where id = society_id and status = 'approved')
  );

create policy "Society admins can insert posts" on public.society_posts
  for insert with check (
    auth.uid() = author_id and
    exists (select 1 from public.societies where id = society_id and admin_id = auth.uid())
  );

create policy "Society admins can update their posts" on public.society_posts
  for update using (
    auth.uid() = author_id and
    exists (select 1 from public.societies where id = society_id and admin_id = auth.uid())
  );

-- Indexes
create index if not exists idx_society_posts_society   on public.society_posts(society_id, created_at desc);
create index if not exists idx_society_posts_feed      on public.society_posts(created_at desc);
create index if not exists idx_society_followers_user  on public.society_followers(user_id);
create index if not exists idx_society_followers_count on public.society_followers(society_id);

-- Add follower_count column to societies
alter table public.societies add column if not exists follower_count int4 not null default 0;

-- Trigger to keep follower_count in sync
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
