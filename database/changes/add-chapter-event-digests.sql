BEGIN;

CREATE TABLE public.event_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE CHECK (name IN ('Pre-Health', 'Pro-Dev', 'Tech', 'General')),
    discord_channel_id text NOT NULL CHECK (discord_channel_id ~ '^[1-9][0-9]{16,19}$'),
    discord_role_id text NOT NULL CHECK (discord_role_id ~ '^[1-9][0-9]{16,19}$')
);

ALTER TABLE public.event_groups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.event_groups FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.event_groups TO authenticated;

CREATE POLICY event_groups_admins_select ON public.event_groups
    FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY event_groups_admins_insert ON public.event_groups
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY event_groups_admins_update ON public.event_groups
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.events ADD COLUMN reminder_audience text
    CHECK (reminder_audience IN ('General', 'Tech', 'Pro-Dev', 'Pre-Health'));

CREATE INDEX events_chapter_digest_idx ON public.events (start_time, id)
    WHERE status = 'published';

CREATE TABLE public.chapter_digest_deliveries (
    event_group_id uuid NOT NULL REFERENCES public.event_groups(id),
    kind text NOT NULL CHECK (kind IN ('daily', 'weekly')),
    window_start timestamptz NOT NULL,
    claimed_at timestamptz NOT NULL DEFAULT now(),
    delivered_at timestamptz,
    PRIMARY KEY (event_group_id, kind, window_start)
);

ALTER TABLE public.chapter_digest_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chapter_digest_deliveries FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.list_chapter_digest_groups()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
    SELECT coalesce(jsonb_agg(jsonb_build_object('id', id, 'discord_channel_id', discord_channel_id,
        'discord_role_id', discord_role_id) ORDER BY id), '[]'::jsonb)
    FROM public.event_groups;
$$;

CREATE FUNCTION public.claim_chapter_digest(
    p_group_id uuid,
    p_kind text,
    p_window_start timestamptz,
    p_window_end timestamptz,
    p_channel_id text,
    p_role_id text
)
RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = pg_catalog AS $$
    WITH snapshot AS (
        SELECT groups.id, groups.name, groups.discord_channel_id, groups.discord_role_id,
            jsonb_agg(
                jsonb_build_object('id', events.id, 'title', events.title,
                    'start_time', events.start_time, 'location', events.location)
                ORDER BY events.start_time, events.id
            ) AS events
        FROM public.event_groups AS groups
        JOIN public.events ON groups.name = coalesce(events.reminder_audience, CASE events.event_type
            WHEN 'Workshop - Pre-Health' THEN 'Pre-Health'
            WHEN 'Workshop - Pro-Dev' THEN 'Pro-Dev'
            WHEN 'Workshop - Tech' THEN 'Tech'
            ELSE 'General'
        END)
        WHERE groups.id = p_group_id
            AND groups.discord_channel_id = p_channel_id AND groups.discord_role_id = p_role_id
            AND events.status = 'published'
            AND events.start_time >= p_window_start
            AND events.start_time < p_window_end
        GROUP BY groups.id
    ), claim AS (
        INSERT INTO public.chapter_digest_deliveries (event_group_id, kind, window_start)
        SELECT id, p_kind, p_window_start FROM snapshot
        ON CONFLICT (event_group_id, kind, window_start) DO NOTHING
        RETURNING event_group_id
    )
    SELECT to_jsonb(snapshot) - 'id'
    FROM snapshot JOIN claim ON claim.event_group_id = snapshot.id;
$$;

CREATE FUNCTION public.finish_chapter_digest(
    p_group_id uuid,
    p_kind text,
    p_window_start timestamptz
)
RETURNS boolean
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = pg_catalog AS $$
    WITH delivered AS (
        UPDATE public.chapter_digest_deliveries
        SET delivered_at = coalesce(delivered_at, now())
        WHERE event_group_id = p_group_id AND kind = p_kind AND window_start = p_window_start
        RETURNING event_group_id
    )
    SELECT EXISTS (SELECT 1 FROM delivered);
$$;

REVOKE EXECUTE ON FUNCTION public.list_chapter_digest_groups() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_chapter_digest(uuid, text, timestamptz, timestamptz, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.finish_chapter_digest(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_chapter_digest_groups() TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_chapter_digest(uuid, text, timestamptz, timestamptz, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_chapter_digest(uuid, text, timestamptz) TO service_role;

COMMIT;
