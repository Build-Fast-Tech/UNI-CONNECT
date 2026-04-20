-- Add provider column to ai_messages for per-provider rate limiting
alter table ai_messages add column if not exists provider text not null default 'claude';

-- Per-provider rate limit function (50 messages / 24h per provider)
create or replace function public.can_send_ai_message_provider(uid uuid, p_provider text)
returns boolean language plpgsql security definer as $$
declare
  msg_count int;
  user_role text;
begin
  select role into user_role from profiles where id = uid;
  if user_role in ('admin', 'moderator') then return true; end if;

  select count(*) into msg_count
  from ai_messages am
  join ai_conversations ac on ac.id = am.conversation_id
  where ac.user_id = uid
    and am.role = 'user'
    and am.provider = p_provider
    and am.created_at > now() - interval '24 hours';

  return msg_count < 50;
end;
$$;
