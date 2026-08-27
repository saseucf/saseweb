import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import {
  type ActivePaymentMatch,
  type AdminMember,
  type AdminAuthorization,
  type AdminMembershipDependencies,
  type MembershipConfiguration,
  type RepositoryResult,
} from "@/lib/admin-membership-core";
import { createServerSupabase } from "@/lib/supabase-server";
import { zeffy } from "@/lib/zeffy";

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function requiredString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function repositoryError(error: PostgrestError | null): RepositoryResult<never> {
  return { ok: false, error: { code: error?.code ?? null } };
}

function parseMember(value: unknown): AdminMember | null {
  const member = record(value);
  const id = requiredString(member?.id);
  const firstName = requiredString(member?.first_name);
  const lastName = typeof member?.last_name === "string" ? member.last_name.trim() : null;
  const email = requiredString(member?.email);
  if (!id || !firstName || lastName === null || !email || typeof member?.paid_member !== "boolean") {
    return null;
  }
  return {
    id,
    firstName,
    lastName,
    email,
    phoneNumber: optionalString(member.phone_number),
    paidMember: member.paid_member,
  };
}

function parseMatch(value: unknown): ActivePaymentMatch | null {
  const match = record(value);
  const id = requiredString(match?.id);
  const providerPaymentId = requiredString(match?.provider_payment_id);
  const profileId = requiredString(match?.profile_id);
  const membershipPeriod = requiredString(match?.membership_period);
  const matchedAt = requiredString(match?.matched_at);
  if (!id || !providerPaymentId || !profileId || !membershipPeriod || !matchedAt) return null;
  return { id, providerPaymentId, profileId, membershipPeriod, matchedAt };
}

export type MembershipConfigurationResult =
  | { ok: true; configuration: MembershipConfiguration }
  | { ok: false; missing: string[] };

export function getMembershipConfiguration(): MembershipConfigurationResult {
  const membershipPeriod = process.env.MEMBERSHIP_PERIOD?.trim() ?? "";
  const amountText = process.env.ZEFFY_EXPECTED_AMOUNT_CENTS?.trim() ?? "";
  const expectedAmountCents = Number(amountText);
  const expectedCurrency = process.env.ZEFFY_EXPECTED_CURRENCY?.trim().toUpperCase() ?? "";
  const missing: string[] = [];
  if (!membershipPeriod) missing.push("MEMBERSHIP_PERIOD");
  if (!amountText || !Number.isSafeInteger(expectedAmountCents) || expectedAmountCents <= 0) {
    missing.push("ZEFFY_EXPECTED_AMOUNT_CENTS");
  }
  if (!/^[A-Z]{3}$/.test(expectedCurrency)) missing.push("ZEFFY_EXPECTED_CURRENCY");
  if (missing.length) return { ok: false, missing };
  return {
    ok: true,
    configuration: { membershipPeriod, expectedAmountCents, expectedCurrency },
  };
}

export async function getAdminAuthorization(): Promise<AdminAuthorization> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { status: "unauthenticated" };

  const profileResult = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();
  if (profileResult.error) return { status: "unavailable" };
  return profileResult.data?.role?.trim().toLowerCase() === "admin"
    ? { status: "authorized", adminId: data.user.id }
    : { status: "forbidden" };
}

export function createAdminMembershipDependencies(
  configuration: MembershipConfiguration,
  authorization?: AdminAuthorization,
): AdminMembershipDependencies {
  const supabase = createServerSupabase();

  return {
    configuration,
    authorizeAdmin: () =>
      authorization ? Promise.resolve(authorization) : getAdminAuthorization(),
    listPayments: () => zeffy.listSuccessfulPayments(),
    listMembers: async () => {
      const result = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone_number, paid_member")
        .order("first_name")
        .order("last_name");
      if (result.error) return repositoryError(result.error);
      const members = (result.data ?? []).map(parseMember);
      if (members.some((member) => member === null)) return repositoryError(null);
      return { ok: true, data: members.filter((member) => member !== null) };
    },
    listActiveMatches: async () => {
      const result = await supabase
        .from("membership_payment_matches")
        .select("id, provider_payment_id, profile_id, membership_period, matched_at")
        .eq("payment_provider", "zeffy")
        .is("unlinked_at", null);
      if (result.error) return repositoryError(result.error);
      const matches = (result.data ?? []).map(parseMatch);
      if (matches.some((match) => match === null)) return repositoryError(null);
      return { ok: true, data: matches.filter((match) => match !== null) };
    },
    matchPayment: async ({ payment, profileId, membershipPeriod }) => {
      const result = await supabase.rpc("match_membership_payment", {
        p_payment_provider: "zeffy",
        p_provider_payment_id: payment.id,
        p_profile_id: profileId,
        p_membership_period: membershipPeriod,
        p_campaign_id: payment.campaignId,
        p_amount_cents: payment.amountCents,
        p_currency: payment.currency,
        p_payment_created_at: payment.createdAt,
      });
      if (result.error) return repositoryError(result.error);
      const matchId = requiredString(result.data);
      return matchId ? { ok: true, data: { matchId } } : repositoryError(null);
    },
    unlinkPayment: async ({ matchId, reason }) => {
      const result = await supabase.rpc("unlink_membership_payment", {
        p_match_id: matchId,
        p_unlink_reason: reason,
      });
      if (result.error) return repositoryError(result.error);
      return typeof result.data === "boolean"
        ? { ok: true, data: { paidMember: result.data } }
        : repositoryError(null);
    },
  };
}
