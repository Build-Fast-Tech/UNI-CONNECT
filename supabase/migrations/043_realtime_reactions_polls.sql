-- Realtime for chat reactions and poll votes.
--
-- message_reactions (030) and poll_votes (031) were created but never added to
-- the supabase_realtime publication, so the realtime subscriptions in
-- app/(app)/chat/[channelId]/page.tsx never received events — reactions (and
-- poll results) only appeared after a manual page refresh.
--
-- REPLICA IDENTITY FULL is required so DELETE payloads carry the full old row
-- (message_id / user_id / emoji), which the un-react handler depends on.

alter table public.message_reactions replica identity full;
alter table public.poll_votes        replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'message_reactions'
  ) then
    alter publication supabase_realtime add table public.message_reactions;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'poll_votes'
  ) then
    alter publication supabase_realtime add table public.poll_votes;
  end if;
end $$;
