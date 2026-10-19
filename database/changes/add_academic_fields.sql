CREATE TABLE IF NOT EXISTS public.academic_fields (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.academic_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view academic fields" ON public.academic_fields;
CREATE POLICY "Anyone can view academic fields"
    ON public.academic_fields FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can insert academic fields" ON public.academic_fields;
CREATE POLICY "Admins can insert academic fields"
    ON public.academic_fields FOR INSERT
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update academic fields" ON public.academic_fields;
CREATE POLICY "Admins can update academic fields"
    ON public.academic_fields FOR UPDATE
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete academic fields" ON public.academic_fields;
CREATE POLICY "Admins can delete academic fields"
    ON public.academic_fields FOR DELETE
    USING (public.is_admin());

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS academic_field_id UUID REFERENCES public.academic_fields(id) ON DELETE SET NULL;
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS academic_field_id UUID REFERENCES public.academic_fields(id) ON DELETE SET NULL;

-- Insert some default fields based on user request
INSERT INTO public.academic_fields (name) VALUES
    ('Computer Science'),
    ('Engineering'),
    ('Pre-Med'),
    ('Business'),
    ('General')
ON CONFLICT (name) DO NOTHING;
