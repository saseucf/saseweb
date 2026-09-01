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
    phone_number TEXT,
    resume_url TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    total_points INTEGER DEFAULT 0 NOT NULL,
    paid_member BOOLEAN DEFAULT FALSE NOT NULL,
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

-- Protect the server-controlled membership status from normal profile edits.
CREATE OR REPLACE FUNCTION public.protect_profile_paid_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.paid_member IS DISTINCT FROM OLD.paid_member
        AND auth.uid() IS NOT NULL
        AND NOT public.is_admin()
    THEN
        NEW.paid_member := OLD.paid_member;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_paid_member_unchanged ON public.profiles;
CREATE TRIGGER ensure_paid_member_unchanged
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_paid_member();


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
    status TEXT DEFAULT 'draft' NOT NULL,
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


-- ==========================================
-- 7. MEMBERSHIP PAYMENT MATCHES
-- ==========================================
CREATE TABLE public.membership_payment_matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_provider TEXT NOT NULL,
    provider_payment_id TEXT NOT NULL,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    membership_period TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,
    payment_created_at TIMESTAMPTZ NOT NULL,
    matched_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unlinked_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    unlinked_at TIMESTAMPTZ,
    unlink_reason TEXT,
    CONSTRAINT membership_payment_matches_provider_not_blank
        CHECK (BTRIM(payment_provider) <> ''),
    CONSTRAINT membership_payment_matches_payment_id_not_blank
        CHECK (BTRIM(provider_payment_id) <> ''),
    CONSTRAINT membership_payment_matches_period_not_blank
        CHECK (BTRIM(membership_period) <> ''),
    CONSTRAINT membership_payment_matches_campaign_not_blank
        CHECK (BTRIM(campaign_id) <> ''),
    CONSTRAINT membership_payment_matches_amount_nonnegative
        CHECK (amount_cents >= 0),
    CONSTRAINT membership_payment_matches_currency_format
        CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT membership_payment_matches_unlink_audit_complete
        CHECK (
            (unlinked_at IS NULL AND unlinked_by IS NULL)
            OR (unlinked_at IS NOT NULL AND unlinked_by IS NOT NULL)
        )
);

CREATE UNIQUE INDEX membership_payment_matches_one_active_payment
    ON public.membership_payment_matches (payment_provider, provider_payment_id)
    WHERE unlinked_at IS NULL;

CREATE UNIQUE INDEX membership_payment_matches_one_active_period
    ON public.membership_payment_matches (profile_id, membership_period)
    WHERE unlinked_at IS NULL;

CREATE INDEX membership_payment_matches_profile_history
    ON public.membership_payment_matches (profile_id, matched_at DESC);

ALTER TABLE public.membership_payment_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can view membership payment matches"
    ON public.membership_payment_matches FOR SELECT
    USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.match_membership_payment(
    p_payment_provider TEXT,
    p_provider_payment_id TEXT,
    p_profile_id UUID,
    p_membership_period TEXT,
    p_campaign_id TEXT,
    p_amount_cents INTEGER,
    p_currency TEXT,
    p_payment_created_at TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_match_id UUID;
    v_paid_member BOOLEAN;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Administrator access required'
            USING ERRCODE = '42501';
    END IF;

    IF NULLIF(BTRIM(p_payment_provider), '') IS NULL
        OR NULLIF(BTRIM(p_provider_payment_id), '') IS NULL
        OR p_profile_id IS NULL
        OR NULLIF(BTRIM(p_membership_period), '') IS NULL
        OR NULLIF(BTRIM(p_campaign_id), '') IS NULL
        OR p_amount_cents IS NULL
        OR p_amount_cents < 0
        OR p_currency IS NULL
        OR UPPER(BTRIM(p_currency)) !~ '^[A-Z]{3}$'
        OR p_payment_created_at IS NULL
    THEN
        RAISE EXCEPTION 'Invalid membership payment details'
            USING ERRCODE = '22023';
    END IF;

    SELECT paid_member
    INTO v_paid_member
    FROM public.profiles
    WHERE id = p_profile_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Member profile not found'
            USING ERRCODE = 'P0002';
    END IF;

    IF v_paid_member THEN
        RAISE EXCEPTION 'Member is already marked as paid'
            USING ERRCODE = '23505';
    END IF;

    INSERT INTO public.membership_payment_matches (
        payment_provider,
        provider_payment_id,
        profile_id,
        membership_period,
        campaign_id,
        amount_cents,
        currency,
        payment_created_at,
        matched_by
    )
    VALUES (
        LOWER(BTRIM(p_payment_provider)),
        BTRIM(p_provider_payment_id),
        p_profile_id,
        BTRIM(p_membership_period),
        BTRIM(p_campaign_id),
        p_amount_cents,
        UPPER(BTRIM(p_currency)),
        p_payment_created_at,
        auth.uid()
    )
    RETURNING id INTO v_match_id;

    UPDATE public.profiles
    SET paid_member = TRUE,
        updated_at = NOW()
    WHERE id = p_profile_id;

    RETURN v_match_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.unlink_membership_payment(
    p_match_id UUID,
    p_unlink_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_match public.membership_payment_matches%ROWTYPE;
    v_paid_member BOOLEAN;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Administrator access required'
            USING ERRCODE = '42501';
    END IF;

    SELECT *
    INTO v_match
    FROM public.membership_payment_matches
    WHERE id = p_match_id
      AND unlinked_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active membership payment match not found'
            USING ERRCODE = 'P0002';
    END IF;

    PERFORM 1
    FROM public.profiles
    WHERE id = v_match.profile_id
    FOR UPDATE;

    UPDATE public.membership_payment_matches
    SET unlinked_by = auth.uid(),
        unlinked_at = NOW(),
        unlink_reason = NULLIF(BTRIM(p_unlink_reason), '')
    WHERE id = v_match.id;

    SELECT EXISTS (
        SELECT 1
        FROM public.membership_payment_matches
        WHERE profile_id = v_match.profile_id
          AND membership_period = v_match.membership_period
          AND unlinked_at IS NULL
    )
    INTO v_paid_member;

    UPDATE public.profiles
    SET paid_member = v_paid_member,
        updated_at = NOW()
    WHERE id = v_match.profile_id;

    RETURN v_paid_member;
END;
$$;

REVOKE ALL ON FUNCTION public.match_membership_payment(
    TEXT, TEXT, UUID, TEXT, TEXT, INTEGER, TEXT, TIMESTAMPTZ
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_membership_payment(
    TEXT, TEXT, UUID, TEXT, TEXT, INTEGER, TEXT, TIMESTAMPTZ
) TO authenticated;

REVOKE ALL ON FUNCTION public.unlink_membership_payment(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlink_membership_payment(UUID, TEXT)
    TO authenticated;
