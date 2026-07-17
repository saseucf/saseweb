-- SASE Portal Database Schema

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT NOT NULL CHECK (first_name <> ''),
    last_name TEXT NOT NULL CHECK (last_name <> ''),
    email TEXT NOT NULL UNIQUE CHECK (email <> ''),
    major TEXT NOT NULL,
    year TEXT NOT NULL,
    school TEXT NOT NULL,
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

-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email, major, year, school)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'major', ''),
        COALESCE(NEW.raw_user_meta_data->>'year', ''),
        COALESCE(NEW.raw_user_meta_data->>'school', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


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
-- (Optional) Only admins can insert/update events. You'd set up an admin role or check for specific user IDs here.


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
