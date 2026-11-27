BEGIN;

CREATE INDEX events_chapter_digest_idx ON public.events (start_time, id)
    WHERE status = 'published';

CREATE TABLE public.chapter_digest_deliveries (
    audience text NOT NULL CHECK (audience IN ('General', 'Pro-Dev', 'Tech', 'Pre-Health', 'Service', 'Socials', 'Fundraisers')),
    kind text NOT NULL CHECK (kind IN ('daily', 'weekly')),
    window_start timestamptz NOT NULL,
    claimed_at timestamptz NOT NULL DEFAULT now(),
    delivered_at timestamptz,
    PRIMARY KEY (audience, kind, window_start)
);

ALTER TABLE public.chapter_digest_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chapter_digest_deliveries FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.claim_chapter_digest(
    p_audience text,
    p_kind text,
    p_window_start timestamptz,
    p_window_end timestamptz
)
RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = pg_catalog AS $$
    WITH snapshot AS (
        SELECT jsonb_agg(
                jsonb_build_object('id', events.id, 'title', events.title,
                    'start_time', events.start_time, 'location', events.location)
                ORDER BY events.start_time, events.id
            ) AS events
        FROM public.events
        WHERE p_audience = CASE events.event_type
            WHEN 'Workshop - Pre-Health' THEN 'Pre-Health'
            WHEN 'Workshop - Pro-Dev' THEN 'Pro-Dev'
            WHEN 'Workshop - Tech' THEN 'Tech'
            WHEN 'Service' THEN 'Service'
            WHEN 'Social' THEN 'Socials'
            WHEN 'Fundraiser' THEN 'Fundraisers'
            ELSE 'General'
        END
            AND events.status = 'published'
            AND events.start_time >= p_window_start
            AND events.start_time < p_window_end
        HAVING count(*) > 0
    ), claim AS (
        INSERT INTO public.chapter_digest_deliveries (audience, kind, window_start)
        SELECT p_audience, p_kind, p_window_start FROM snapshot
        ON CONFLICT (audience, kind, window_start) DO NOTHING
        RETURNING audience
    )
    SELECT snapshot.events FROM snapshot CROSS JOIN claim;
$$;

CREATE FUNCTION public.finish_chapter_digest(
    p_audience text,
    p_kind text,
    p_window_start timestamptz
)
RETURNS boolean
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = pg_catalog AS $$
    WITH delivered AS (
        UPDATE public.chapter_digest_deliveries
        SET delivered_at = coalesce(delivered_at, now())
        WHERE audience = p_audience AND kind = p_kind AND window_start = p_window_start
        RETURNING audience
    )
    SELECT EXISTS (SELECT 1 FROM delivered);
$$;

REVOKE EXECUTE ON FUNCTION public.claim_chapter_digest(text, text, timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.finish_chapter_digest(text, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_chapter_digest(text, text, timestamptz, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_chapter_digest(text, text, timestamptz) TO service_role;

COMMIT;
