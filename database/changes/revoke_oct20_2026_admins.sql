-- Run AFTER secure_roles_and_checkin.sql in the Supabase SQL Editor as postgres.
-- Account creation means auth.users.created_at, not profile creation time.
-- October 20, 2026 is interpreted in America/New_York (Eastern Time).
BEGIN;

LOCK TABLE public.profiles, public.event_attendances IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE oct20_admin_targets ON COMMIT DROP AS
SELECT p.id, p.email, u.created_at AS account_created_at,
       CASE WHEN lower(btrim(p.role)) = 'admin' THEN 'member' ELSE p.role END AS new_role
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.created_at >= (TIMESTAMP '2026-10-20 00:00:00' AT TIME ZONE 'America/New_York')
  AND u.created_at < (TIMESTAMP '2026-10-21 00:00:00' AT TIME ZONE 'America/New_York')
  AND (lower(btrim(p.role)) = 'admin' OR p.is_admin = true);

-- Save the expected final state of every profile. Only targeted role/flag
-- changes and automatic updated_at timestamps are permitted.
CREATE TEMP TABLE oct20_expected_profiles ON COMMIT DROP AS
SELECT CASE WHEN t.id IS NOT NULL THEN
         (to_jsonb(p) - 'updated_at') || jsonb_build_object('role', t.new_role, 'is_admin', false)
       ELSE to_jsonb(p) END AS row_data,
       p.id, t.id IS NOT NULL AS targeted
FROM public.profiles p
LEFT JOIN oct20_admin_targets t ON t.id = p.id;

CREATE TEMP TABLE oct20_attendances_before ON COMMIT DROP AS
SELECT to_jsonb(a) AS row_data FROM public.event_attendances a;

UPDATE public.profiles p
SET role = t.new_role, is_admin = false
FROM oct20_admin_targets t
WHERE p.id = t.id;

DO $$
BEGIN
  IF EXISTS (
    SELECT row_data FROM oct20_expected_profiles
    EXCEPT
    SELECT CASE WHEN e.targeted THEN to_jsonb(p) - 'updated_at' ELSE to_jsonb(p) END
    FROM public.profiles p LEFT JOIN oct20_expected_profiles e ON e.id = p.id
  ) OR EXISTS (
    SELECT CASE WHEN e.targeted THEN to_jsonb(p) - 'updated_at' ELSE to_jsonb(p) END
    FROM public.profiles p LEFT JOIN oct20_expected_profiles e ON e.id = p.id
    EXCEPT SELECT row_data FROM oct20_expected_profiles
  ) THEN
    RAISE EXCEPTION 'Demotion aborted: unexpected profile changes';
  END IF;
  IF EXISTS (
    SELECT row_data FROM oct20_attendances_before
    EXCEPT SELECT to_jsonb(a) FROM public.event_attendances a
  ) OR EXISTS (
    SELECT to_jsonb(a) FROM public.event_attendances a
    EXCEPT SELECT row_data FROM oct20_attendances_before
  ) THEN
    RAISE EXCEPTION 'Demotion aborted: unexpected attendance changes';
  END IF;
END;
$$;

SELECT id, email, account_created_at, new_role
FROM oct20_admin_targets ORDER BY account_created_at;

COMMIT;
