-- Per-message read receipts for chat. The client upserts on (message_id,user_id)
-- and subscribes to INSERTs via realtime. Previously applied only via the
-- dashboard on the original project. Referenced by
-- app/(app)/chat/[channelId]/page.tsx.

create table if not exists public.message_reads (
  id         uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

create index if not exists message_reads_message_id_idx on public.message_reads(message_id);
create index if not exists message_reads_user_id_idx    on public.message_reads(user_id);

alter table public.message_reads enable row level security;

drop policy if exists "message_reads_auth_read" on public.message_reads;
create policy "message_reads_auth_read"
  on public.message_reads for select to authenticated using (true);

drop policy if exists "message_reads_insert_own" on public.message_reads;
create policy "message_reads_insert_own"
  on public.message_reads for insert to authenticated
  with check (user_id = auth.uid());

-- enable realtime for read-receipt fan-out
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'message_reads'
  ) then
    alter publication supabase_realtime add table public.message_reads;
  end if;
end $$;
