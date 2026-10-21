-- 1. Add role column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'member';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN is_admin SET DEFAULT FALSE;

-- 2. Create function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. Protect the role column with a trigger
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

-- 4. Update Event Policies
-- Drop existing insert/update/delete policies if they exist
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

-- Create new policies
CREATE POLICY "Admins can insert events" 
    ON public.events FOR INSERT 
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update events" 
    ON public.events FOR UPDATE 
    USING (public.is_admin());

CREATE POLICY "Admins can delete events" 
    ON public.events FOR DELETE 
    USING (public.is_admin());

-- 5. Update Forms Policies
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view forms so they can fill them out
DROP POLICY IF EXISTS "Anyone can view forms" ON public.forms;
DROP POLICY IF EXISTS "Only admins can view forms" ON public.forms;
CREATE POLICY "Anyone can view forms"
    ON public.forms
    FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can create forms
DROP POLICY IF EXISTS "Only admins can create forms" ON public.forms;
CREATE POLICY "Only admins can create forms"
    ON public.forms
    FOR INSERT
    TO authenticated
    WITH CHECK (
        created_by = auth.uid()
        AND public.is_admin()
    );

-- Only admins can update forms
DROP POLICY IF EXISTS "Only admins can update forms" ON public.forms;
CREATE POLICY "Only admins can update forms"
    ON public.forms
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Only admins can delete forms
DROP POLICY IF EXISTS "Only admins can delete forms" ON public.forms;
CREATE POLICY "Only admins can delete forms"
    ON public.forms
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 6. Add event_id to forms
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

