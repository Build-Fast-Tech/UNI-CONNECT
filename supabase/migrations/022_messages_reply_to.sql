-- Add reply threading and media support to messages
alter table public.messages
  add column if not exists reply_to_id uuid references public.messages(id) on delete set null,
  add column if not exists gif_url     text,
  add column if not exists sticker_id  text;

create index if not exists idx_messages_reply_to
  on public.messages(reply_to_id);
