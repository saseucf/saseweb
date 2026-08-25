-- SASE Portal Database Schema

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    -- No "<> ''" check here: OAuth providers (Discord, etc.) often only give a
    -- single display name, which can split into an empty last_name (e.g. a
    -- one-word Discord username). handle_new_user() below always fills these
    -- in with something, but we don't want the insert to hard-fail if it can't.
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE CHECK (email <> ''),
    major TEXT NOT NULL,
    year TEXT NOT NULL,
    school TEXT NOT NULL,
    role TEXT DEFAULT 'member' NOT NULL,
    -- Names auto-filled from OAuth metadata are only a best guess (see
    -- handle_new_user() below). This starts FALSE for new signups so the
    -- app can prompt the user to confirm/edit their name once; it's set
    -- TRUE after they do.
    name_confirmed BOOLEAN DEFAULT FALSE NOT NULL,
    grad_date DATE,
    shirt_size TEXT,
    resume_url TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    total_points INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Secure the profiles table with RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Function to automatically create a profile when a new user signs up.
--
-- Different signup paths give us different pieces of a name, and none of
-- them are fully reliable:
--   - Google OAuth    -> structured given_name / family_name (reliable)
--   - Discord OAuth    -> only a single display name, exposed by Supabase as
--                          full_name / name / user_name (no real last name)
--   - Email/password   -> only a "username"
-- We pick the best available signal to auto-fill first/last name, but since
-- it's only ever a guess, name_confirmed starts FALSE and the app prompts
-- the user to confirm/edit it once after signup (see /confirm-name).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    display_name TEXT;
    derived_first_name TEXT;
    derived_last_name TEXT;
    space_pos INT;
BEGIN
    -- 1. Google gives structured given_name/family_name directly - prefer
    --    that over splitting a single display name.
    -- 2. A real first_name/last_name pair, if explicitly provided.
    -- 3. Otherwise fall back to splitting whatever single display name is
    --    available, in priority order, on its first space.
    --    "Jane Doe" -> "Jane" / "Doe". "kevin" -> "kevin" / "".
    IF NULLIF(TRIM(NEW.raw_user_meta_data->>'given_name'), '') IS NOT NULL THEN
        derived_first_name := TRIM(NEW.raw_user_meta_data->>'given_name');
        derived_last_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'family_name'), ''), '');
    ELSIF NEW.raw_user_meta_data ? 'first_name' AND NEW.raw_user_meta_data ? 'last_name' THEN
        derived_first_name := NEW.raw_user_meta_data->>'first_name';
        derived_last_name := NEW.raw_user_meta_data->>'last_name';
    ELSE
        display_name := COALESCE(
            NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
            NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
            NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
            NULLIF(TRIM(NEW.raw_user_meta_data->>'user_name'), ''),
            'New Member'
        );

        space_pos := POSITION(' ' IN display_name);
        IF space_pos > 0 THEN
            derived_first_name := SUBSTRING(display_name FROM 1 FOR space_pos - 1);
            derived_last_name := SUBSTRING(display_name FROM space_pos + 1);
        ELSE
            derived_first_name := display_name;
            derived_last_name := '';
        END IF;
    END IF;

    INSERT INTO public.profiles (id, first_name, last_name, email, major, year, school, name_confirmed)
    VALUES (
        NEW.id,
        derived_first_name,
        derived_last_name,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'major', ''),
        COALESCE(NEW.raw_user_meta_data->>'year', ''),
        COALESCE(NEW.raw_user_meta_data->>'school', ''),
        FALSE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Protect the role column with a trigger
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


-- ==========================================
-- 2. EVENTS TABLE
-- ==========================================
DROP TABLE IF EXISTS public.events CASCADE;
CREATE TABLE public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL, -- e.g. 'Workshop', 'Social', 'GBM'
    location TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    capacity INTEGER,
    points INTEGER DEFAULT 1 NOT NULL,
    host TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
-- Everyone can read events
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);

-- Admins can insert/update/delete events
CREATE POLICY "Admins can insert events" ON public.events FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE USING (public.is_admin());


-- ==========================================
-- 3. EVENT RSVPS TABLE
-- ==========================================
DROP TABLE IF EXISTS public.event_rsvps CASCADE;
CREATE TABLE public.event_rsvps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'Going' NOT NULL, -- 'Going', 'Waitlisted', 'Cancelled'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all RSVPs for events" ON public.event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can insert their own RSVP" ON public.event_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own RSVP" ON public.event_rsvps FOR UPDATE USING (auth.uid() = user_id);


-- ==========================================
-- 4. EVENT ATTENDANCES TABLE (Check-ins)
-- ==========================================
DROP TABLE IF EXISTS public.event_attendances CASCADE;
CREATE TABLE public.event_attendances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    checked_in_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_text TEXT,
    UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_attendances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own attendances" ON public.event_attendances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can check themselves in" ON public.event_attendances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own feedback" ON public.event_attendances FOR UPDATE USING (auth.uid() = user_id);


-- ==========================================
-- 5. FUNCTION TO UPDATE TOTAL POINTS ON CHECK-IN
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_user_points()
RETURNS TRIGGER AS $$
DECLARE
    event_points INTEGER;
BEGIN
    -- Get the point value of the event
    SELECT points INTO event_points FROM public.events WHERE id = NEW.event_id;
    
    -- Add points to the user's profile
    UPDATE public.profiles
    SET total_points = total_points + COALESCE(event_points, 0)
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_event_attendance_created
    AFTER INSERT ON public.event_attendances
    FOR EACH ROW EXECUTE FUNCTION public.update_user_points();

-- ==========================================
-- 6. FORMS TABLE (snippet)
-- ==========================================
-- Note: forms table definition might already exist in Supabase, but adding event_id here for tracking:
-- ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

