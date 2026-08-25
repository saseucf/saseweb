-- Add phone number field to profiles.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Auto-filled names from OAuth metadata are only a best guess. Add a flag
-- so the app can prompt new signups to confirm/edit their name once.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS name_confirmed BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing members already have real names on file; don't interrupt them.
UPDATE public.profiles SET name_confirmed = TRUE WHERE name_confirmed = FALSE;

-- Prefer Google's structured given_name/family_name over splitting a single
-- display name, and always mark newly-created profiles as unconfirmed.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    display_name TEXT;
    derived_first_name TEXT;
    derived_last_name TEXT;
    space_pos INT;
BEGIN
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
