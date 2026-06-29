-- Ensure the single global ("All-Pakistan") chat channel exists.
--
-- 001_initial_schema seeds it, but on the live project the row is missing
-- (the seed used `on conflict do nothing` with no unique target, and the schema
-- was re-applied across project moves). The channels INSERT policy forbids
-- clients from creating a 'global' channel, so it can only be (re)created here.
--
-- Idempotent: inserts only when no global channel exists yet.

insert into public.channels (type, name)
select 'global', 'All-Pakistan Chat'
where not exists (
  select 1 from public.channels where type = 'global'
);
