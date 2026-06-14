-- 037_security_rls_hardening.sql
--
-- Closes two tables that were created in 001_initial_schema.sql WITHOUT row level
-- security. In Supabase, a table in the `public` schema with RLS *disabled* is
-- fully readable AND writable by anyone holding the anon key — and the anon key
-- ships in the browser bundle. So these two tables were effectively wide open.
--
-- Safe to run on a live database: idempotent (drops policies before recreating)
-- and only tightens access.

-- ── audit_logs ────────────────────────────────────────────────────────────────
-- Sensitive admin trail (who did what, to whom). The client never touches this
-- table, so: admins can read it; nobody can write it from a client connection.
-- (Server-side service-role / SECURITY DEFINER triggers bypass RLS and keep
-- working — the absence of INSERT/UPDATE/DELETE policies denies *client* writes.)
alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_admin_read" on public.audit_logs;
create policy "audit_logs_admin_read"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ── subjects ──────────────────────────────────────────────────────────────────
-- Reference data (subject names) read by the notes pages. Keep it world-readable
-- but restrict writes to admins so the catalogue can't be vandalised, polluted,
-- or wiped via the public anon key.
alter table public.subjects enable row level security;

drop policy if exists "subjects_public_read" on public.subjects;
create policy "subjects_public_read"
  on public.subjects for select
  using (true);

drop policy if exists "subjects_admin_write" on public.subjects;
create policy "subjects_admin_write"
  on public.subjects for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
