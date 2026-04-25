-- 017_username_in_trigger.sql
-- Update the profile creation trigger to also store username from user metadata.
-- New users who sign up with a username will have it set automatically.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  raw_username text;
begin
  -- Read username from metadata (set during signUp); null if not provided
  raw_username := lower(trim(new.raw_user_meta_data->>'username'));

  -- If username is present but invalid or already taken, ignore it (profile
  -- will have username = null and the app will prompt them to set one)
  if raw_username is not null and raw_username ~ '^[a-z0-9_]{3,20}$' then
    -- Only use it if not already taken
    if not exists (select 1 from public.profiles where username = raw_username) then
      insert into public.profiles (id, full_name, email, username)
      values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.email,
        raw_username
      );
      return new;
    end if;
  end if;

  -- Fallback: insert without username
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;
