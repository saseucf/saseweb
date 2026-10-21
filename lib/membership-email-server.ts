import "server-only";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase-server";
import { getMembershipConfiguration } from "@/lib/admin-membership";
import { planEmailMembershipMatches, normalizedEmail, type EmailMember, type EmailPaymentMatch } from "@/lib/membership-email";
import { zeffy } from "@/lib/zeffy";

export async function reconcileEmailMemberships(scope: { adminId: string } | { userId: string; email: string }) {
  const configuration = getMembershipConfiguration();
  if (!configuration.ok) throw new Error("Payment integration is not configured.");
  const service = createAdminSupabase();
  const members: EmailMember[] = [];
  const history: EmailPaymentMatch[] = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await service.from("profiles").select("id,email,paid_member").order("id").range(offset, offset + 999);
    if (result.error) throw new Error("Membership records could not be loaded.");
    members.push(...result.data);
    if (result.data.length < 1000) break;
  }
  for (let offset = 0; ; offset += 1000) {
    const result = await service.from("membership_payment_matches").select("provider_payment_id,profile_id,membership_period,unlinked_at").eq("payment_provider", "zeffy").order("id").range(offset, offset + 999);
    if (result.error) throw new Error("Payment assignments could not be loaded.");
    history.push(...result.data);
    if (result.data.length < 1000) break;
  }
  const payments = await zeffy.listSuccessfulPayments();
  if (!payments.ok) throw new Error("Payments could not be loaded. Try again shortly.");
  const plan = planEmailMembershipMatches(payments.data, members, history, configuration.configuration)
    .filter(({ member }) => "adminId" in scope || (member.id === scope.userId && normalizedEmail(member.email) === normalizedEmail(scope.email)));
  let matched = 0;
  let failed = 0;
  for (const { payment, member, existing } of plan) {
    if (!existing) {
      if ("adminId" in scope) {
        // Existing RPC saves the assignment and paid flag atomically.
        const result = await createServerSupabase().rpc("match_membership_payment", {
          p_payment_provider: "zeffy", p_provider_payment_id: payment.id, p_profile_id: member.id,
          p_membership_period: configuration.configuration.membershipPeriod, p_campaign_id: payment.campaignId,
          p_amount_cents: payment.amountCents, p_currency: payment.currency, p_payment_created_at: payment.createdAt,
        });
        if (result.error) { failed++; continue; }
        matched++;
        continue;
      }
      const result = await service.from("membership_payment_matches").insert({
        payment_provider: "zeffy", provider_payment_id: payment.id, profile_id: member.id,
        membership_period: configuration.configuration.membershipPeriod, campaign_id: payment.campaignId,
        amount_cents: payment.amountCents, currency: payment.currency, payment_created_at: payment.createdAt,
        matched_by: scope.userId,
      });
      if (result.error && result.error.code !== "23505") { failed++; continue; }
    }
    // Recover interrupted self-service verification and recheck ownership after conflicts.
    const active = await service.from("membership_payment_matches").select("id")
      .eq("payment_provider", "zeffy").eq("provider_payment_id", payment.id).eq("profile_id", member.id)
      .eq("membership_period", configuration.configuration.membershipPeriod).is("unlinked_at", null).maybeSingle();
    if (active.error || !active.data) { failed++; continue; }
    const updated = await service.from("profiles").update({ paid_member: true }).eq("id", member.id).eq("email", member.email!).select("id").maybeSingle();
    if (updated.error || !updated.data) { failed++; continue; }
    matched++;
  }
  return { matched, failed };
}
