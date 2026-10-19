-- Apply before deploying guest check-in. No existing profile data is changed.
CREATE TABLE IF NOT EXISTS public.guest_checkin_attempts (
  fingerprint text PRIMARY KEY,
  started_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 1
);
ALTER TABLE public.guest_checkin_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.guest_checkin_attempts FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_guest_checkin_attempt(fingerprint text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE attempt_count integer;
BEGIN
  DELETE FROM public.guest_checkin_attempts WHERE started_at < now() - interval '1 day';
  INSERT INTO public.guest_checkin_attempts AS bucket (fingerprint) VALUES ($1)
  ON CONFLICT ON CONSTRAINT guest_checkin_attempts_pkey DO UPDATE SET
    attempts = CASE WHEN bucket.started_at < now() - interval '10 minutes' THEN 1 ELSE bucket.attempts + 1 END,
    started_at = CASE WHEN bucket.started_at < now() - interval '10 minutes' THEN now() ELSE bucket.started_at END
  RETURNING attempts INTO attempt_count;
  RETURN attempt_count <= CASE WHEN left($1, 3) = 'ip:' THEN 120 ELSE 5 END;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_guest_checkin_attempt(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_guest_checkin_attempt(text) TO service_role;
