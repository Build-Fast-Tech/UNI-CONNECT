-- Fix societies INSERT policy: auth.role() is unreliable; use auth.uid() IS NOT NULL
drop policy if exists "societies_insert_any" on public.societies;

create policy "societies_insert_authenticated"
  on public.societies for insert
  with check (auth.uid() is not null and auth.uid() = admin_id);

-- Also ensure updated_at column exists for suggestions (needed by admin feedback update)
alter table public.suggestions add column if not exists updated_at timestamptz default now();

-- Ensure society_followers is in realtime publication
alter table public.society_followers replica identity full;
do $$
begin
  begin
    alter publication supabase_realtime add table public.society_followers;
  exception when others then null;
  end;
end $$;
