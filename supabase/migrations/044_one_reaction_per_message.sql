-- Enforce ONE reaction per user per message (previously a user could stack
-- several different emojis on the same message). The chat UI already swaps a
-- user's reaction client-side; this guarantees it at the database level.

-- 1. De-duplicate any existing rows: keep a single reaction per (message, user).
delete from public.message_reactions a
using public.message_reactions b
where a.message_id = b.message_id
  and a.user_id   = b.user_id
  and a.created_at < b.created_at;

-- break exact-timestamp ties deterministically (keep the lowest id)
delete from public.message_reactions a
using public.message_reactions b
where a.message_id = b.message_id
  and a.user_id   = b.user_id
  and a.created_at = b.created_at
  and a.id > b.id;

-- 2. Add the stricter uniqueness. (The original UNIQUE(message_id,user_id,emoji)
--    can stay — this 2-column index is what actually enforces one-per-message.)
create unique index if not exists message_reactions_one_per_user
  on public.message_reactions (message_id, user_id);
