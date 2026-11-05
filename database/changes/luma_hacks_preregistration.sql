-- LumaHacks preregistration fields.
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS university TEXT,
    ADD COLUMN IF NOT EXISTS hackathon_participating BOOLEAN DEFAULT FALSE NOT NULL;

DROP POLICY IF EXISTS "Public LumaHacks form" ON public.forms;
CREATE POLICY "Public LumaHacks form"
    ON public.forms FOR SELECT
    TO anon, authenticated
    USING (slug = 'lumahacks' AND is_open = TRUE);

DROP POLICY IF EXISTS "Public LumaHacks submissions" ON public.form_submissions;
CREATE POLICY "Public LumaHacks submissions"
    ON public.form_submissions FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.forms
            WHERE forms.id = form_submissions.form_id
              AND forms.slug = 'lumahacks'
              AND forms.is_open = TRUE
              AND forms.requires_login = FALSE
        )
    );

CREATE OR REPLACE FUNCTION public.mark_luma_hacks_participant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    form_slug TEXT;
    response_email TEXT;
    response_university TEXT;
BEGIN
    SELECT slug INTO form_slug FROM public.forms WHERE id = NEW.form_id;
    IF form_slug = 'lumahacks' THEN
        response_email := LOWER(BTRIM(NEW.responses->>'email'));
        response_university := NULLIF(BTRIM(NEW.responses->>'school'), '');
        UPDATE public.profiles
        SET hackathon_participating = TRUE,
            university = response_university,
            updated_at = NOW()
        WHERE LOWER(email) = response_email;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mark_luma_hacks_participant_on_submission ON public.form_submissions;
CREATE TRIGGER mark_luma_hacks_participant_on_submission
    AFTER INSERT ON public.form_submissions
    FOR EACH ROW EXECUTE FUNCTION public.mark_luma_hacks_participant();

INSERT INTO public.forms (
    title, description, slug, schema, requires_login, is_open, created_by
)
SELECT
    'LumaHacks Preregistration',
    'Preregister for LumaHacks by UCF SASE.',
    'lumahacks',
    '[
      {"id":"first_name","type":"short_text","label":"First Name","required":true},
      {"id":"last_name","type":"short_text","label":"Last Name","required":true},
      {"id":"age","type":"select","label":"Age","required":true,"options":["13","14","15","16","17","18","19","20","21","22","23","24","25+"]},
      {"id":"phone","type":"short_text","label":"Phone Number","required":true},
      {"id":"email","type":"short_text","label":"Email Address","required":true},
      {"id":"code_of_conduct","type":"checkbox","label":"Code of Conduct and Contest Terms","required":true,"options":["I agree to the MLH Code of Conduct and contest terms."]},
      {"id":"info_sharing","type":"checkbox","label":"MLH Info-Sharing Authorization","required":true,"options":["I agree to the MLH Privacy Policy and data-sharing terms."]},
      {"id":"partnership","type":"checkbox","label":"Optional Partnership","required":false,"options":["I agree to receive information from MLH partners."]},
      {"id":"school","type":"short_text","label":"School (use your official school name)","required":true},
      {"id":"level_of_study","type":"multiple_choice","label":"Level of Study","required":true,"options":["High school","Undergraduate","Graduate","Other"]},
      {"id":"major","type":"short_text","label":"Major or field of study","required":false},
      {"id":"dietary_restrictions","type":"short_text","label":"Dietary restrictions or accessibility needs","required":false}
    ]'::jsonb,
    FALSE,
    TRUE,
    profiles.id
FROM public.profiles
WHERE profiles.role = 'admin'
LIMIT 1
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    schema = EXCLUDED.schema,
    requires_login = FALSE,
    is_open = TRUE;
