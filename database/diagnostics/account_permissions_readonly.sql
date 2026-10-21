-- READ ONLY. Run in Supabase SQL Editor as postgres.
-- Retrieves deployed defaults, function bodies, triggers, and policies.
-- Does not change data, permissions, or settings.

SELECT table_name, column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('role', 'is_admin', 'paid_member', 'total_points');

SELECT n.nspname AS schema_name, c.relname AS table_name,
       t.tgname AS trigger_name, pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal
  AND ((n.nspname = 'auth' AND c.relname = 'users')
    OR (n.nspname = 'public' AND c.relname IN ('profiles', 'event_attendances')))
ORDER BY schema_name, table_name, trigger_name;

SELECT n.nspname AS schema_name, p.proname AS function_name,
       p.prosecdef AS security_definer, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('handle_new_user', 'protect_profile_role', 'is_admin',
    'protect_profile_paid_member', 'update_user_points', 'increment',
    'claim_guest_checkin_attempt');

SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'event_attendances', 'events')
ORDER BY tablename, policyname;
