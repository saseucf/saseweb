-- Add the current membership status used by the member-facing experience.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS paid_member BOOLEAN NOT NULL DEFAULT FALSE;

-- The column may already exist from an earlier manual setup. Normalize that
-- shape so this migration guarantees the same contract in every environment.
UPDATE public.profiles
SET paid_member = FALSE
WHERE paid_member IS NULL;

ALTER TABLE public.profiles
ALTER COLUMN paid_member SET DEFAULT FALSE;

ALTER TABLE public.profiles
ALTER COLUMN paid_member SET NOT NULL;

-- Members can edit their own profiles, so protect the server-controlled
-- membership flag from being changed through the normal profile update path.
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
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_paid_member();

-- Keep the data model provider-neutral so Zeffy can be replaced by Stripe
-- without changing how membership assignments and reversals are audited.
CREATE TABLE IF NOT EXISTS public.membership_payment_matches (
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

-- Preserve historical assignments while allowing an unlinked payment to be
-- assigned again. Only active rows participate in these uniqueness rules.
CREATE UNIQUE INDEX IF NOT EXISTS membership_payment_matches_one_active_payment
    ON public.membership_payment_matches (payment_provider, provider_payment_id)
    WHERE unlinked_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS membership_payment_matches_one_active_period
    ON public.membership_payment_matches (profile_id, membership_period)
    WHERE unlinked_at IS NULL;

CREATE INDEX IF NOT EXISTS membership_payment_matches_profile_history
    ON public.membership_payment_matches (profile_id, matched_at DESC);

ALTER TABLE public.membership_payment_matches ENABLE ROW LEVEL SECURITY;

-- The admin dashboard needs to search all profiles for an unpaid member.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view membership payment matches"
    ON public.membership_payment_matches;
CREATE POLICY "Admins can view membership payment matches"
    ON public.membership_payment_matches FOR SELECT
    USING (public.is_admin());

-- Match a verified provider payment and update the profile in one transaction.
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

-- Unlink locally without refunding the provider payment. The old row remains
-- for audit history, and the provider payment can then be reassigned.
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
