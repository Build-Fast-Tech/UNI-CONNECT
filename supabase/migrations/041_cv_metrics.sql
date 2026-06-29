-- 041_cv_metrics.sql
-- CV reach metrics: split "impressions" (CV shown in a browse list / seen but
-- not opened) from "opens" (the existing `views` counter — file actually opened).
--
-- WHY RPCs: the `cvs_update_own` RLS policy only lets the OWNER update their row,
-- so the previous client-side `update cvs set views = views + 1` on someone
-- else's CV was silently rejected and the counter never moved. These
-- SECURITY DEFINER functions bump ONLY the counters, safely, for any
-- authenticated viewer.

-- 1. New counter ---------------------------------------------------------------
alter table public.cvs
  add column if not exists impressions int not null default 0;

-- 2. Opens / "clicks" — one CV opened ------------------------------------------
create or replace function public.increment_cv_view(cv_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.cvs set views = views + 1 where id = cv_id;
$$;

-- 3. Impressions — a batch of CVs was shown in a browse list -------------------
create or replace function public.increment_cv_impressions(ids uuid[])
returns void
language sql
security definer
set search_path = public
as $$
  update public.cvs set impressions = impressions + 1
  where id = any(ids);
$$;

grant execute on function public.increment_cv_view(uuid)        to authenticated;
grant execute on function public.increment_cv_impressions(uuid[]) to authenticated;
