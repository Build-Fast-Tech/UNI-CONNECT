-- 042_seed_admins.sql
-- Grant platform admin to the two owner accounts. `profiles.role = 'admin'` is
-- what every admin gate in the app checks (admin layout, sidebar, RLS, etc.).
--
-- Two parts:
--   1. Promote the accounts if they already exist.
--   2. Teach the new-user trigger to auto-assign admin to these emails, so a
--      fresh signup (or a re-signup after a reset) still lands as admin.

-- 1. Promote existing accounts -------------------------------------------------
update public.profiles
set role = 'admin'
where lower(email) in ('abdullah.xf90@gmail.com', 'i250014@isb.nu.edu.pk')
  and role <> 'admin';

-- 2. Auto-assign on signup (extends the trigger from 017_username_in_trigger) --
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  raw_username  text;
  assigned_role text;
begin
  raw_username := lower(trim(new.raw_user_meta_data->>'username'));

  -- Owner emails always become admins; everyone else starts as a student.
  assigned_role := case
    when lower(new.email) in ('abdullah.xf90@gmail.com', 'i250014@isb.nu.edu.pk')
      then 'admin'
    else 'student'
  end;

  -- Use the supplied username only if it is valid and not already taken.
  if raw_username is not null and raw_username ~ '^[a-z0-9_]{3,20}$' then
    if not exists (select 1 from public.profiles where username = raw_username) then
      insert into public.profiles (id, full_name, email, username, role)
      values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.email,
        raw_username,
        assigned_role
      );
      return new;
    end if;
  end if;

  -- Fallback: insert without username
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    assigned_role
  );
  return new;
end;
$$;
