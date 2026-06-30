-- Security hardening from the Supabase advisors:
--
-- 1. Pin search_path on SECURITY DEFINER / trigger functions
--    (lint 0011 function_search_path_mutable).
-- 2. Remove trigger/internal functions from the public REST RPC surface — they
--    are only ever invoked by triggers, never meant to be called directly
--    (lints 0028/0029 *_security_definer_function_executable).
-- 3. CV-metric RPCs should be callable by signed-in users only, not anon.

-- 1. Pin search_path -----------------------------------------------------------
alter function public.handle_new_user()                       set search_path = public;
alter function public.set_updated_at()                        set search_path = public;
alter function public.sync_society_follower_count()           set search_path = public;
alter function public.can_send_ai_message(uuid)               set search_path = public;
alter function public.can_send_ai_message_provider(uuid, text) set search_path = public;

-- 2. Trigger / internal functions: drop from the REST API (triggers still fire;
--    they don't rely on the caller's EXECUTE grant).
revoke execute on function public.handle_new_user()             from anon, authenticated, public;
revoke execute on function public.set_updated_at()             from anon, authenticated, public;
revoke execute on function public.sync_society_follower_count() from anon, authenticated, public;
revoke execute on function public.rls_auto_enable()            from anon, authenticated, public;

-- 3. CV metrics + AI quota checks: authenticated only (not anon).
revoke execute on function public.increment_cv_view(uuid)        from anon, public;
revoke execute on function public.increment_cv_impressions(uuid[]) from anon, public;
revoke execute on function public.can_send_ai_message(uuid)        from anon, public;
revoke execute on function public.can_send_ai_message_provider(uuid, text) from anon, public;
