-- Fix overly-permissive SELECT policies on message_reactions and poll_votes.
-- Previously both used USING (true), leaking all reactions/votes to every
-- authenticated user regardless of channel membership.
-- New policy: a user may only read reactions/votes for messages they can
-- already read (mirrors the existing messages_read policy logic).

-- message_reactions
DROP POLICY IF EXISTS "reactions_select" ON message_reactions;

CREATE POLICY "reactions_select" ON message_reactions
  FOR SELECT TO authenticated
  USING (
    exists (
      select 1 from messages m
      join channels c on c.id = m.channel_id
      where m.id = message_reactions.message_id
        and (
          c.type = 'global'
          or c.dm_user_a = auth.uid()
          or c.dm_user_b = auth.uid()
        )
    )
    or exists (
      select 1 from messages m
      join channels c on c.id = m.channel_id
      join profiles p on p.id = auth.uid()
      where m.id = message_reactions.message_id
        and (
          (c.type = 'university' and p.university_id = c.university_id)
          or (c.type = 'branch'   and p.branch_id    = c.branch_id)
        )
    )
  );

-- poll_votes
DROP POLICY IF EXISTS "poll_votes_select" ON poll_votes;

CREATE POLICY "poll_votes_select" ON poll_votes
  FOR SELECT TO authenticated
  USING (
    exists (
      select 1 from messages m
      join channels c on c.id = m.channel_id
      where m.id = poll_votes.message_id
        and (
          c.type = 'global'
          or c.dm_user_a = auth.uid()
          or c.dm_user_b = auth.uid()
        )
    )
    or exists (
      select 1 from messages m
      join channels c on c.id = m.channel_id
      join profiles p on p.id = auth.uid()
      where m.id = poll_votes.message_id
        and (
          (c.type = 'university' and p.university_id = c.university_id)
          or (c.type = 'branch'   and p.branch_id    = c.branch_id)
        )
    )
  );
