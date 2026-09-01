-- 1. Add missing status column to events table, setting existing events to 'published' so they don't disappear from the site
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' NOT NULL;

-- 2. Change the default back to 'draft' for any future events created without a status
ALTER TABLE public.events ALTER COLUMN status SET DEFAULT 'draft';

-- 3. Add RLS policy to allow admins to update profiles (required for promoting/demoting admins)
CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    USING (public.is_admin());
