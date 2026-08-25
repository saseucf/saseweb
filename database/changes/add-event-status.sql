-- Add publishing status to events
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';

-- Only allow recognized event statuses
ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_status_check;

ALTER TABLE public.events
ADD CONSTRAINT events_status_check
CHECK (status IN ('draft', 'published', 'cancelled'));