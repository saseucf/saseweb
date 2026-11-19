-- Apply after add-event-status.sql. Additive: retain events.reminded during rollout.
BEGIN;
CREATE TABLE public.hackathons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    discord_channel_id text CHECK (discord_channel_id ~ '^[0-9]{17,20}$'),
    discord_role_id text CHECK (discord_role_id ~ '^[0-9]{17,20}$'),
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
CREATE POLICY hackathons_admin ON public.hackathons FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());
REVOKE ALL ON public.hackathons FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hackathons TO authenticated, service_role;
INSERT INTO public.hackathons (name, slug) VALUES ('LumaHacks 2027', 'lumahacks-2027');

ALTER TABLE public.events ADD COLUMN hackathon_id uuid REFERENCES public.hackathons(id) ON DELETE RESTRICT;
CREATE INDEX events_hackathon_reminder_due ON public.events(start_time)
    WHERE hackathon_id IS NOT NULL AND status = 'published';
CREATE TABLE public.event_reminder_deliveries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    reminder_key text NOT NULL DEFAULT 'starts_60_minutes' CHECK (reminder_key = 'starts_60_minutes'),
    state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','delivering','delivered','failed','unknown')),
    event_start_at timestamptz NOT NULL,
    content_snapshot jsonb NOT NULL,
    channel_id_snapshot text NOT NULL,
    role_id_snapshot text NOT NULL,
    attempt_count integer NOT NULL DEFAULT 0,
    locked_at timestamptz,
    next_attempt_at timestamptz,
    last_error text,
    delivered_at timestamptz,
    discord_message_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(event_id, reminder_key)
);
ALTER TABLE public.event_reminder_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.event_reminder_deliveries FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_reminder_deliveries TO service_role;

-- One transaction leases one delivery; lock order is event, hackathon, delivery.
-- Only the trusted bot can call these functions. Never expose the service key to browsers.
CREATE FUNCTION public.claim_hackathon_reminder(p_now timestamptz DEFAULT now())
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    candidate record;
    config public.hackathons%ROWTYPE;
    delivery public.event_reminder_deliveries%ROWTYPE;
    snapshot jsonb;
BEGIN
    UPDATE public.event_reminder_deliveries SET state = 'unknown', locked_at = NULL,
        next_attempt_at = NULL, last_error = 'delivery_outcome_ambiguous'
    WHERE state = 'delivering' AND locked_at <= p_now - interval '30 seconds';

    FOR candidate IN
        SELECT e.* FROM public.events e
        WHERE e.hackathon_id IS NOT NULL AND e.status = 'published'
          AND e.start_time > p_now AND e.start_time <= p_now + interval '60 minutes'
        ORDER BY e.start_time, e.id FOR UPDATE OF e SKIP LOCKED
    LOOP
        SELECT * INTO config FROM public.hackathons WHERE id = candidate.hackathon_id FOR SHARE;
        IF config.discord_channel_id IS NULL OR config.discord_role_id IS NULL THEN
            CONTINUE;
        END IF;
        snapshot := jsonb_build_object('title', candidate.title, 'description', candidate.description,
            'event_type', candidate.event_type, 'location', candidate.location,
            'start_time', candidate.start_time, 'end_time', candidate.end_time);
        INSERT INTO public.event_reminder_deliveries
            (event_id, event_start_at, content_snapshot, channel_id_snapshot, role_id_snapshot)
        VALUES (candidate.id, candidate.start_time, snapshot, config.discord_channel_id, config.discord_role_id)
        ON CONFLICT (event_id, reminder_key) DO NOTHING;
        SELECT * INTO delivery FROM public.event_reminder_deliveries
            WHERE event_id = candidate.id AND reminder_key = 'starts_60_minutes' FOR UPDATE;
        IF delivery.state NOT IN ('pending','failed') THEN CONTINUE; END IF;
        IF delivery.attempt_count = 0 THEN
            UPDATE public.event_reminder_deliveries SET event_start_at = candidate.start_time,
                content_snapshot = snapshot, channel_id_snapshot = config.discord_channel_id,
                role_id_snapshot = config.discord_role_id WHERE id = delivery.id;
        ELSIF delivery.event_start_at IS DISTINCT FROM candidate.start_time
            OR delivery.content_snapshot IS DISTINCT FROM snapshot
            OR delivery.channel_id_snapshot IS DISTINCT FROM config.discord_channel_id
            OR delivery.role_id_snapshot IS DISTINCT FROM config.discord_role_id THEN
            -- Do not resend an attempted snapshot after edits; an operator must review.
            UPDATE public.event_reminder_deliveries SET state = 'unknown', next_attempt_at = NULL,
                last_error = 'event_changed_after_attempt' WHERE id = delivery.id;
            CONTINUE;
        END IF;
        IF delivery.state = 'failed' AND (delivery.next_attempt_at IS NULL OR delivery.next_attempt_at > p_now) THEN
            CONTINUE;
        END IF;
        UPDATE public.event_reminder_deliveries SET state = 'delivering', locked_at = p_now,
            next_attempt_at = NULL, last_error = NULL, attempt_count = attempt_count + 1
        WHERE id = delivery.id RETURNING * INTO delivery;
        RETURN to_jsonb(delivery);
    END LOOP;
    RETURN NULL;
END;
$$;

CREATE FUNCTION public.finish_hackathon_reminder(p_id uuid, p_state text,
    p_error text DEFAULT NULL, p_message_id text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE changed integer;
BEGIN
    IF p_state NOT IN ('delivered','failed','unknown') THEN RAISE EXCEPTION 'Invalid delivery outcome'; END IF;
    UPDATE public.event_reminder_deliveries SET state = p_state, locked_at = NULL,
        next_attempt_at = CASE WHEN p_state = 'failed' THEN now() + interval '5 minutes' ELSE NULL END,
        last_error = left(p_error, 500),
        delivered_at = CASE WHEN p_state = 'delivered' THEN now() ELSE NULL END,
        discord_message_id = CASE WHEN p_state = 'delivered' THEN p_message_id ELSE NULL END
    WHERE id = p_id AND state = 'delivering';
    GET DIAGNOSTICS changed = ROW_COUNT;
    RETURN changed = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_hackathon_reminder(timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_hackathon_reminder(uuid,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_hackathon_reminder(timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_hackathon_reminder(uuid,text,text,text) TO service_role;
COMMIT;
