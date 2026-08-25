-- 1. Add role column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' NOT NULL;

-- 2. Create function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Protect the role column with a trigger
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
    -- If someone tries to update their role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Allow role changes only if the user is an admin, or if this is the service_role/dashboard (auth.uid() is null)
        IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
            NEW.role = OLD.role;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_role_unchanged ON public.profiles;
CREATE TRIGGER ensure_role_unchanged
    BEFORE UPDATE ON public.profiles
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

