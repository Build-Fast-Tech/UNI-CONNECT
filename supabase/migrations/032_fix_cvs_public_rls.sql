-- Fix: public CVs should be readable by all authenticated users, not just employers
drop policy if exists "cvs_read" on cvs;

create policy "cvs_read"
  on cvs for select using (
    user_id = auth.uid()
    or (
      visibility = 'public'
      and auth.uid() is not null
    )
    or (
      visibility = 'employers_only'
      and exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('employer','admin'))
    )
  );
