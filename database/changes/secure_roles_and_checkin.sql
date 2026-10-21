-- Apply to the existing database; do not re-run schema.sql (it drops tables).
BEGIN;

-- Keep the comparison stable while the migration runs. Existing rows are never
-- rewritten; these transaction-local snapshots are discarded on commit/rollback.
LOCK TABLE public.profiles, public.event_attendances IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE role_fix_profiles_before ON COMMIT DROP AS
  SELECT to_jsonb(p) - 'is_admin' AS row_data FROM public.profiles p;
CREATE TEMP TABLE role_fix_attendances_before ON COMMIT DROP AS
  SELECT to_jsonb(a) AS row_data FROM public.event_attendances a;

ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'member';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ALTER COLUMN is_admin SET DEFAULT false;

-- One source of administrator authority. SECURITY DEFINER avoids recursive RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Signup triggers and profile recovery must never create administrators,
    -- even when metadata or an old column default asks for elevated access.
    NEW.role := 'member';
    NEW.is_admin := false;
    NEW.paid_member := false;
    NEW.total_points := 0;
  ELSE
    IF NEW.role IS DISTINCT FROM OLD.role
      AND NOT (
        COALESCE(auth.role(), '') = 'service_role'
        OR public.is_admin()
        OR (auth.uid() IS NULL AND session_user IN ('postgres', 'supabase_admin'))
      ) THEN
      RAISE EXCEPTION 'Administrator access required to change roles' USING ERRCODE = '42501';
    END IF;
    -- The legacy flag cannot independently grant administrator privileges.
    NEW.is_admin := NEW.role = 'admin';
    -- Points may be awarded by the nested attendance trigger, but never by
    -- a member directly editing their profile through the public API.
    IF pg_trigger_depth() = 1
      AND NOT (
        COALESCE(auth.role(), '') = 'service_role'
        OR public.is_admin()
        OR (auth.uid() IS NULL AND session_user IN ('postgres', 'supabase_admin'))
      ) THEN
      NEW.total_points := OLD.total_points;
      NEW.paid_member := OLD.paid_member;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_role_unchanged ON public.profiles;
CREATE TRIGGER ensure_role_unchanged BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- Preserve every existing profile without rewriting any values. Legacy flags
-- are ignored for authorization; future profile updates synchronize them.

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id AND role = 'member' AND NOT is_admin);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.event_attendances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can check themselves in" ON public.event_attendances;
CREATE POLICY "Users can check themselves in" ON public.event_attendances FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.events WHERE id = event_id
        AND COALESCE(to_jsonb(events)->>'status', '') <> 'cancelled'
    )
  );
DROP POLICY IF EXISTS "Admins can check in any user" ON public.event_attendances;
CREATE POLICY "Admins can check in any user" ON public.event_attendances FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- Abort the entire transaction if any existing profile or attendance changed.
-- Exclude only is_admin because this migration may introduce that column.
DO $$
BEGIN
  IF EXISTS (
    SELECT row_data FROM role_fix_profiles_before
    EXCEPT SELECT to_jsonb(p) - 'is_admin' FROM public.profiles p
  ) OR EXISTS (
    SELECT to_jsonb(p) - 'is_admin' FROM public.profiles p
    EXCEPT SELECT row_data FROM role_fix_profiles_before
  ) THEN
    RAISE EXCEPTION 'Migration aborted: existing member data changed';
  END IF;
  IF EXISTS (
    SELECT row_data FROM role_fix_attendances_before
    EXCEPT SELECT to_jsonb(a) FROM public.event_attendances a
  ) OR EXISTS (
    SELECT to_jsonb(a) FROM public.event_attendances a
    EXCEPT SELECT row_data FROM role_fix_attendances_before
  ) THEN
    RAISE EXCEPTION 'Migration aborted: existing attendance data changed';
  END IF;
END;
$$;

COMMIT;
